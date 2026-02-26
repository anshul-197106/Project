from django.contrib import admin
from .models import User, Profile


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'is_freelancer', 'is_buyer', 'date_joined']
    list_filter = ['is_freelancer', 'is_buyer']
    search_fields = ['username', 'email']


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'full_name', 'hourly_rate', 'average_rating', 'total_orders_completed']
    search_fields = ['user__username', 'full_name', 'skills']
