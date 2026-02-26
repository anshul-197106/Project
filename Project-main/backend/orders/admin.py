from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'gig', 'buyer', 'status', 'amount', 'created_at']
    list_filter = ['status']
    search_fields = ['gig__title', 'buyer__username']
