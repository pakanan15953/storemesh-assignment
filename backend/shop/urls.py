from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView,
    ProfileView,
    ProductViewSet,
    CartViewSet,
    OrderViewSet
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')

# Manual mapping for Cart actions since it is a singleton resource for each buyer
cart_detail = CartViewSet.as_view({
    'get': 'retrieve'
})
cart_add_item = CartViewSet.as_view({
    'post': 'add_item'
})
cart_update_item = CartViewSet.as_view({
    'put': 'update_item',
    'patch': 'update_item'
})
cart_remove_item = CartViewSet.as_view({
    'delete': 'remove_item'
})

urlpatterns = [
    # Auth endpoints
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Cart endpoints
    path('cart/', cart_detail, name='cart_detail'),
    path('cart/add_item/', cart_add_item, name='cart_add_item'),
    path('cart/update_item/<int:item_id>/', cart_update_item, name='cart_update_item'),
    path('cart/remove_item/<int:item_id>/', cart_remove_item, name='cart_remove_item'),

    # Router endpoints (Products, Orders)
    path('', include(router.urls)),
]
