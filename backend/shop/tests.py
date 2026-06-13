from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from shop.models import Product, Cart, CartItem, Order, OrderItem

User = get_user_model()

class UserAuthTests(APITestCase):
    def test_register_buyer_success(self):
        """ทดสอบการสมัครสมาชิกบทบาทผู้ซื้อ (BUYER) สำเร็จ"""
        url = reverse('auth_register')
        data = {
            'username': 'buyer1',
            'email': 'buyer1@example.com',
            'password': 'password123',
            'role': 'BUYER'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'buyer1')
        self.assertEqual(response.data['email'], 'buyer1@example.com')
        self.assertEqual(response.data['role'], 'BUYER')

    def test_register_seller_success(self):
        """ทดสอบการสมัครสมาชิกบทบาทผู้ขาย (SELLER) สำเร็จ"""
        url = reverse('auth_register')
        data = {
            'username': 'seller1',
            'email': 'seller1@example.com',
            'password': 'password123',
            'role': 'SELLER'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['role'], 'SELLER')

    def test_login_jwt_success(self):
        """ทดสอบการเข้าสู่ระบบและรับ JWT Token สำเร็จ"""
        User.objects.create_user(username='testuser', email='test@example.com', password='password123', role='BUYER')
        url = reverse('token_obtain_pair')
        data = {
            'username': 'testuser',
            'password': 'password123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_profile_authenticated(self):
        """ทดสอบดึงข้อมูลโปรไฟล์ส่วนตัวเมื่อเข้าสู่ระบบแล้วสำเร็จ"""
        user = User.objects.create_user(username='testuser', email='test@example.com', password='password123', role='BUYER')
        self.client.force_authenticate(user=user)
        url = reverse('auth_profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')

    def test_profile_unauthenticated(self):
        """ทดสอบดึงข้อมูลโปรไฟล์ส่วนตัวเมื่อยังไม่ได้เข้าสู่ระบบ จะต้องถูกปฏิเสธ (401 Unauthorized)"""
        url = reverse('auth_profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProductAPITests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(username='seller1', email='s1@ex.com', password='password123', role='SELLER')
        self.buyer = User.objects.create_user(username='buyer1', email='b1@ex.com', password='password123', role='BUYER')
        self.product = Product.objects.create(
            seller=self.seller,
            title='Test Product',
            description='Test description',
            price=150.00,
            quantity=10
        )

    def test_list_products_anonymous(self):
        """ทดสอบการเรียกดูรายการสินค้าทั้งหมดโดยบุคคลทั่วไป (ไม่จำเป็นต้องล็อกอิน)"""
        url = reverse('product-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_product_seller(self):
        """ทดสอบการเพิ่มสินค้าใหม่โดยผู้ขาย (SELLER) สำเร็จ"""
        self.client.force_authenticate(user=self.seller)
        url = reverse('product-list')
        data = {
            'title': 'New Product',
            'description': 'New Desc',
            'price': '99.99',
            'quantity': 5
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Product')
        self.assertEqual(response.data['seller_username'], 'seller1')

    def test_create_product_buyer_forbidden(self):
        """ทดสอบป้องกันไม่ให้ผู้ซื้อ (BUYER) สามารถลงทะเบียนเพิ่มสินค้าได้ (สิทธิ์ลงสินค้าเป็นของ SELLER เท่านั้น)"""
        self.client.force_authenticate(user=self.buyer)
        url = reverse('product-list')
        data = {
            'title': 'New Product',
            'price': '99.99',
            'quantity': 5
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_product_owner(self):
        """ทดสอบการแก้ไขข้อมูลสินค้าโดยผู้ขายที่เป็นเจ้าของสินค้า สำเร็จ"""
        self.client.force_authenticate(user=self.seller)
        url = reverse('product-detail', kwargs={'pk': self.product.id})
        data = {'title': 'Updated Title', 'price': 200.00, 'quantity': 10}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.title, 'Updated Title')

    def test_update_product_non_owner_forbidden(self):
        """ทดสอบป้องกันไม่ให้ผู้ขายคนอื่นที่ไม่ใช่เจ้าของสินค้าเข้ามาแก้ไขข้อมูลสินค้าได้"""
        another_seller = User.objects.create_user(username='seller2', email='s2@ex.com', password='password123', role='SELLER')
        self.client.force_authenticate(user=another_seller)
        url = reverse('product-detail', kwargs={'pk': self.product.id})
        data = {'title': 'Hack Title', 'price': 200.00, 'quantity': 10}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_product_owner(self):
        """ทดสอบการลบสินค้าโดยผู้ขายที่เป็นเจ้าของสินค้า สำเร็จ"""
        self.client.force_authenticate(user=self.seller)
        url = reverse('product-detail', kwargs={'pk': self.product.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(id=self.product.id).exists())

    def test_delete_product_non_owner_forbidden(self):
        """ทดสอบป้องกันไม่ให้ผู้ขายคนอื่นที่ไม่ใช่เจ้าของสินค้าเข้ามาลบสินค้าได้"""
        another_seller = User.objects.create_user(username='seller2', email='s2@ex.com', password='password123', role='SELLER')
        self.client.force_authenticate(user=another_seller)
        url = reverse('product-detail', kwargs={'pk': self.product.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Product.objects.filter(id=self.product.id).exists())


class CartAPITests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(username='seller1', email='s1@ex.com', password='password123', role='SELLER')
        self.buyer = User.objects.create_user(username='buyer1', email='b1@ex.com', password='password123', role='BUYER')
        self.product = Product.objects.create(
            seller=self.seller,
            title='Phone',
            price=1000.00,
            quantity=5
        )

    def test_get_cart_creates_on_demand(self):
        """ทดสอบดึงข้อมูลตะกร้าสินค้า โดยระบบจะสร้างตะกร้าให้อัตโนมัติหากยังไม่มีในระบบ"""
        self.client.force_authenticate(user=self.buyer)
        url = reverse('cart_detail')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['buyer'], self.buyer.username)
        self.assertEqual(len(response.data['items']), 0)
        self.assertTrue(Cart.objects.filter(buyer=self.buyer).exists())

    def test_add_item_success(self):
        """ทดสอบการเพิ่มสินค้าเข้าตะกร้าสินค้าโดยผู้ซื้อ (BUYER) สำเร็จ"""
        self.client.force_authenticate(user=self.buyer)
        url = reverse('cart_add_item')
        data = {'product_id': self.product.id, 'quantity': 2}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 1)
        self.assertEqual(response.data['items'][0]['product']['title'], 'Phone')
        self.assertEqual(response.data['items'][0]['quantity'], 2)

    def test_add_item_insufficient_stock(self):
        """ทดสอบการเพิ่มสินค้าเข้าตะกร้าเมื่อเลือกจำนวนมากกว่าคลังสินค้าที่มีอยู่ จะต้องถูกปฏิเสธ (400 Bad Request)"""
        self.client.force_authenticate(user=self.buyer)
        url = reverse('cart_add_item')
        data = {'product_id': self.product.id, 'quantity': 6} # Only 5 available
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_add_item_seller_forbidden(self):
        """ทดสอบป้องกันไม่ให้ผู้ขาย (SELLER) นำสินค้าเข้าตะกร้าตัวเองได้ (สิทธิ์มีเฉพาะ BUYER เท่านั้น)"""
        self.client.force_authenticate(user=self.seller)
        url = reverse('cart_add_item')
        data = {'product_id': self.product.id, 'quantity': 1}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_cart_item(self):
        """ทดสอบการอัปเดตจำนวนสินค้าที่อยู่ในตะกร้าสินค้าสำเร็จ"""
        self.client.force_authenticate(user=self.buyer)
        cart = Cart.objects.create(buyer=self.buyer)
        cart_item = CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        
        url = reverse('cart_update_item', kwargs={'item_id': cart_item.id})
        data = {'quantity': 3}
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cart_item.refresh_from_db()
        self.assertEqual(cart_item.quantity, 3)

    def test_remove_cart_item(self):
        """ทดสอบการลบรายการสินค้าออกจากตะกร้าสำเร็จ"""
        self.client.force_authenticate(user=self.buyer)
        cart = Cart.objects.create(buyer=self.buyer)
        cart_item = CartItem.objects.create(cart=cart, product=self.product, quantity=1)
        
        url = reverse('cart_remove_item', kwargs={'item_id': cart_item.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(CartItem.objects.filter(id=cart_item.id).exists())


class OrderCheckoutTests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(username='seller1', email='s1@ex.com', password='password123', role='SELLER')
        self.buyer = User.objects.create_user(username='buyer1', email='b1@ex.com', password='password123', role='BUYER')
        self.product1 = Product.objects.create(seller=self.seller, title='Item A', price=100.00, quantity=10)
        self.product2 = Product.objects.create(seller=self.seller, title='Item B', price=50.00, quantity=5)

    def test_checkout_success(self):
        """ทดสอบสั่งซื้อสินค้า (Checkout) และตัดสต็อกสินค้าในคลังพร้อมเคลียร์ตะกร้าสำเร็จ"""
        self.client.force_authenticate(user=self.buyer)
        cart = Cart.objects.create(buyer=self.buyer)
        CartItem.objects.create(cart=cart, product=self.product1, quantity=2)
        CartItem.objects.create(cart=cart, product=self.product2, quantity=1)

        url = reverse('order-list') # OrderViewSet create endpoint
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'COMPLETED')
        self.assertEqual(float(response.data['total_price']), 250.00)

        # Check stock deduction
        self.product1.refresh_from_db()
        self.product2.refresh_from_db()
        self.assertEqual(self.product1.quantity, 8)
        self.assertEqual(self.product2.quantity, 4)

        # Check cart cleared
        self.assertEqual(cart.items.count(), 0)

    def test_checkout_empty_cart(self):
        """ทดสอบทำการสั่งซื้อ (Checkout) เมื่อตะกร้าว่างเปล่า จะต้องถูกปฏิเสธ (400 Bad Request)"""
        self.client.force_authenticate(user=self.buyer)
        url = reverse('order-list')
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_checkout_insufficient_stock_rollback(self):
        """ทดสอบระบบ Transaction Rollback หากมีสินค้าชิ้นใดชิ้นหนึ่งสต็อกไม่พอ จะต้องยกเลิกคำสั่งซื้อทั้งหมด สต็อกเดิมต้องไม่ลดลง และสินค้าในตะกร้าต้องไม่หาย"""
        self.client.force_authenticate(user=self.buyer)
        cart = Cart.objects.create(buyer=self.buyer)
        CartItem.objects.create(cart=cart, product=self.product1, quantity=2)
        CartItem.objects.create(cart=cart, product=self.product2, quantity=6) # 6 exceeds stock of 5

        url = reverse('order-list')
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Check database rolled back (neither product quantity was deducted)
        self.product1.refresh_from_db()
        self.product2.refresh_from_db()
        self.assertEqual(self.product1.quantity, 10)
        self.assertEqual(self.product2.quantity, 5)

        # Cart is NOT cleared
        self.assertEqual(cart.items.count(), 2)

    def test_list_orders_buyer(self):
        """ทดสอบดึงประวัติสั่งซื้อของผู้ซื้อ (BUYER) โดยจะดึงเฉพาะออเดอร์ของตนเองเท่านั้น"""
        order = Order.objects.create(buyer=self.buyer, total_price=150.00, status='COMPLETED')
        OrderItem.objects.create(order=order, product=self.product1, quantity=1, unit_price=100.00)
        OrderItem.objects.create(order=order, product=self.product2, quantity=1, unit_price=50.00)

        another_buyer = User.objects.create_user(username='buyer2', email='b2@ex.com', password='password123', role='BUYER')
        another_order = Order.objects.create(buyer=another_buyer, total_price=100.00, status='COMPLETED')
        OrderItem.objects.create(order=another_order, product=self.product1, quantity=1, unit_price=100.00)

        self.client.force_authenticate(user=self.buyer)
        url = reverse('order-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], order.id)

    def test_list_orders_seller(self):
        """ทดสอบดึงประวัติสั่งซื้อของผู้ขาย (SELLER) โดยจะดึงเฉพาะออเดอร์ของสินค้าที่ตนเองขายเท่านั้น"""
        order = Order.objects.create(buyer=self.buyer, total_price=100.00, status='COMPLETED')
        OrderItem.objects.create(order=order, product=self.product1, quantity=1, unit_price=100.00)

        another_seller = User.objects.create_user(username='seller2', email='s2@ex.com', password='password123', role='SELLER')
        product3 = Product.objects.create(seller=another_seller, title='Item C', price=20.00, quantity=5)
        another_order = Order.objects.create(buyer=self.buyer, total_price=20.00, status='COMPLETED')
        OrderItem.objects.create(order=another_order, product=product3, quantity=1, unit_price=20.00)

        self.client.force_authenticate(user=self.seller)
        url = reverse('order-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], order.id)
