from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Gig
from .serializers import (
    CategorySerializer, GigListSerializer,
    GigDetailSerializer, GigCreateSerializer
)


class IsSellerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller == request.user


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class GigListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['price', 'created_at', 'average_rating', 'total_orders']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return GigCreateSerializer
        return GigListSerializer

    def get_queryset(self):
        queryset = Gig.objects.filter(is_active=True).select_related('seller', 'category')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        return queryset


class GigDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Gig.objects.select_related('seller', 'category')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsSellerOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return GigCreateSerializer
        return GigDetailSerializer


class MyGigsView(generics.ListAPIView):
    """List all gigs created by the authenticated user."""
    serializer_class = GigListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Gig.objects.filter(seller=self.request.user).select_related('category')


class FeaturedGigsView(generics.ListAPIView):
    """Return top-rated gigs for the homepage."""
    serializer_class = GigListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Gig.objects.filter(
            is_active=True
        ).select_related('seller', 'category').order_by('-average_rating', '-total_orders')[:8]
