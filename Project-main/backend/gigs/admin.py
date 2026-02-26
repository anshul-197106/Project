from django.contrib import admin
from .models import Category, Gig


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Gig)
class GigAdmin(admin.ModelAdmin):
    list_display = ['title', 'seller', 'category', 'price', 'is_active', 'average_rating', 'total_orders']
    list_filter = ['category', 'is_active']
    search_fields = ['title', 'description']
