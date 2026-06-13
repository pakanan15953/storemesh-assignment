from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Product, Cart, CartItem, Order, OrderItem

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'created_at')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'BUYER')
        )
        return user


class ProductSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(source='seller.username', read_only=True)

    class Meta:
        model = Product
        fields = ('id', 'seller', 'seller_username', 'title', 'description', 'price', 'quantity', 'image', 'created_at', 'updated_at')
        read_only_fields = ('id', 'seller', 'created_at', 'updated_at')


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_id', 'quantity')


class CartSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    buyer = serializers.CharField(source='buyer.username', read_only=True)

    class Meta:
        model = Cart
        fields = ('id', 'buyer', 'items', 'created_at')

    def get_items(self, obj):
        ordered_items = obj.items.all().order_by('id')
        return CartItemSerializer(ordered_items, many=True, context=self.context).data


class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_title', 'product_image', 'quantity', 'unit_price')

    def get_product_title(self, obj):
        return obj.product.title if obj.product else "Deleted Product"

    def get_product_image(self, obj):
        if obj.product and obj.product.image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_username = serializers.CharField(source='buyer.username', read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'buyer', 'buyer_username', 'total_price', 'status', 'items', 'created_at')
        read_only_fields = ('id', 'buyer', 'total_price', 'status', 'created_at')
