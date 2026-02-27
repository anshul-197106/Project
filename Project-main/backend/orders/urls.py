from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListCreateView.as_view(), name='order_list_create'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order_detail'),
    path('<int:pk>/status/', views.OrderStatusUpdateView.as_view(), name='order_status_update'),
    path('<int:pk>/submit-delivery/', views.SubmitDeliveryView.as_view(), name='submit_delivery'),
    path('direct-order/', views.DirectOrderView.as_view(), name='direct_order'),
    path('create-checkout-session/', views.CreateCheckoutSessionView.as_view(), name='create_checkout_session'),
    path('webhook/', views.StripeWebhookView.as_view(), name='stripe_webhook'),
]
