from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'gig', 'reviewer', 'rating', 'created_at']
    list_filter = ['rating']
    search_fields = ['gig__title', 'reviewer__username', 'comment']
