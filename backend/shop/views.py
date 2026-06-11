from django.shortcuts import render
from rest_framework import viewsets, permissions, generics, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from django.contrib.auth import get_user_model

from .models import Product, Cart, CartItem, Order, OrderItem
from .serializers import (
    UserSerializer,
    ProductSerializer,
    CartSerializer,
    CartItemSerializer,
    OrderSerializer
)

User = get_user_model()

# =========================================================================
# 👤 Authentication & User Profile Views
# =========================================================================

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# =========================================================================
# 🛡️ Custom Permission Classes
# =========================================================================

class IsSellerOrReadOnly(permissions.BasePermission):
    """
    Allow read-only requests for anyone.
    Allow write requests only for registered SELLERs who own the product.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'SELLER'

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller == request.user


class IsBuyer(permissions.BasePermission):
    """
    Allow access only to users with the BUYER role.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'BUYER'


# =========================================================================
# 🛍️ E-commerce Feature ViewSets (Product, Cart, Order)
# =========================================================================

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsSellerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        # Automatically set the seller to the logged-in user
        serializer.save(seller=self.request.user)


class CartViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsBuyer]

    def retrieve(self, request):
        cart, _ = Cart.objects.get_or_create(buyer=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='add_item')
    def add_item(self, request):
        cart, _ = Cart.objects.get_or_create(buyer=request.user)
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)

        if not product_id:
            return Response({"error": "product_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response({"error": "quantity must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({"error": "quantity must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        # Validate stock availability
        if product.quantity < quantity:
            return Response({"error": f"Only {product.quantity} items available in stock"}, status=status.HTTP_400_BAD_REQUEST)

        cart_item, item_created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not item_created:
            new_qty = cart_item.quantity + quantity
            if product.quantity < new_qty:
                return Response({
                    "error": f"Cannot add more. Only {product.quantity} items available, and you already have {cart_item.quantity} in your cart."
                }, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = new_qty
        else:
            cart_item.quantity = quantity
        cart_item.save()

        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'], url_path='update_item/(?P<item_id>[^/.]+)')
    def update_item(self, request, item_id=None):
        cart, _ = Cart.objects.get_or_create(buyer=request.user)
        try:
            cart_item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({"error": "Cart item not found"}, status=status.HTTP_404_NOT_FOUND)

        quantity = request.data.get('quantity')
        if quantity is None:
            return Response({"error": "quantity is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = int(quantity)
        except ValueError:
            return Response({"error": "quantity must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        if quantity <= 0:
            cart_item.delete()
        else:
            if cart_item.product.quantity < quantity:
                return Response({"error": f"Only {cart_item.product.quantity} items available in stock"}, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = quantity
            cart_item.save()

        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'], url_path='remove_item/(?P<item_id>[^/.]+)')
    def remove_item(self, request, item_id=None):
        cart, _ = Cart.objects.get_or_create(buyer=request.user)
        try:
            cart_item = CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({"error": "Cart item not found"}, status=status.HTTP_404_NOT_FOUND)

        cart_item.delete()
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'BUYER':
            return Order.objects.filter(buyer=user).order_by('-created_at')
        elif user.role == 'SELLER':
            # A Seller can view orders that contain their products
            return Order.objects.filter(items__product__seller=user).distinct().order_by('-created_at')
        return Order.objects.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role != 'BUYER':
            return Response({"error": "Only buyers can checkout and create orders"}, status=status.HTTP_403_FORBIDDEN)

        try:
            cart = Cart.objects.get(buyer=user)
        except Cart.DoesNotExist:
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = cart.items.all()
        if not cart_items.exists():
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Atomic transaction to ensure Database Integrity
            with transaction.atomic():
                # 1. Validate stock availability for all products in the cart first
                for item in cart_items:
                    if item.product.quantity < item.quantity:
                        return Response({
                            "error": f"Product '{item.product.title}' is out of stock. Available: {item.product.quantity}"
                        }, status=status.HTTP_400_BAD_REQUEST)

                # 2. Create the Order object
                order = Order.objects.create(buyer=user, total_price=0, status='COMPLETED')
                total_price = 0

                # 3. Create OrderItems, deduct stock, and calculate total price
                for item in cart_items:
                    product = item.product
                    # Deduct stock
                    product.quantity -= item.quantity
                    product.save()

                    # Create OrderItem with price snapshot
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=item.quantity,
                        unit_price=product.price
                    )
                    total_price += product.price * item.quantity

                # 4. Save final total price
                order.total_price = total_price
                order.save()

                # 5. Clear the buyer's cart items
                cart_items.delete()

                serializer = self.get_serializer(order)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Checkout failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

