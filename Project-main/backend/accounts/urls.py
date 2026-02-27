from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.ProfileView.as_view(), name='my_profile'),
    path('profile/<int:user_id>/', views.PublicProfileView.as_view(), name='public_profile'),
    path('dashboard/', views.DashboardStatsView.as_view(), name='dashboard_stats'),
    path('freelancers/', views.FreelancerListView.as_view(), name='freelancer_list'),
    # Admin endpoints
    path('admin/dashboard/', views.AdminDashboardView.as_view(), name='admin_dashboard'),
    path('admin/orders/', views.AdminOrdersView.as_view(), name='admin_orders'),
    path('admin/users/', views.AdminUsersView.as_view(), name='admin_users'),
]
