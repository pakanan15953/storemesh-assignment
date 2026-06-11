from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from shop.models import Product

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with test users and products'

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding database...")
        
        # 1. Create Sellers
        seller1, created = User.objects.get_or_create(
            username='seller1',
            email='seller1@storemesh.com',
            defaults={'role': 'SELLER'}
        )
        if created:
            seller1.set_password('password123')
            seller1.save()
            
        seller2, created = User.objects.get_or_create(
            username='seller2',
            email='seller2@storemesh.com',
            defaults={'role': 'SELLER'}
        )
        if created:
            seller2.set_password('password123')
            seller2.save()

        # 2. Create Buyers
        buyer1, created = User.objects.get_or_create(
            username='buyer1',
            email='buyer1@storemesh.com',
            defaults={'role': 'BUYER'}
        )
        if created:
            buyer1.set_password('password123')
            buyer1.save()

        # 3. Create Products
        products_data = [
            {
                'seller': seller1,
                'title': 'Mechanical Keyboard',
                'description': 'RGB Mechanical Keyboard with Blue switches. Aluminum frame.',
                'price': 1290.00,
                'quantity': 15,
                'image': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'
            },
            {
                'seller': seller1,
                'title': 'Wireless Gaming Mouse',
                'description': '16000 DPI wireless gaming mouse with optical sensor and long battery life.',
                'price': 890.00,
                'quantity': 25,
                'image': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500'
            },
            {
                'seller': seller2,
                'title': '27" IPS Monitor 144Hz',
                'description': 'Crisp 27-inch IPS gaming monitor with 144Hz refresh rate and 1ms response time.',
                'price': 5400.00,
                'quantity': 5,
                'image': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500'
            },
            {
                'seller': seller2,
                'title': 'Noise Cancelling Headphones',
                'description': 'Over-ear active noise cancelling bluetooth headphones with premium sound quality.',
                'price': 2500.00,
                'quantity': 10,
                'image': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'
            }
        ]

        for p_data in products_data:
            Product.objects.get_or_create(
                title=p_data['title'],
                defaults=p_data
            )

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
