from rest_framework import generics, permissions
from .models import Review
from .serializers import ReviewSerializer, ReviewCreateSerializer


class ReviewListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_queryset(self):
        queryset = Review.objects.select_related('reviewer', 'gig', 'order')
        gig_id = self.request.query_params.get('gig')
        if gig_id:
            queryset = queryset.filter(gig_id=gig_id)
        return queryset


class ReviewDetailView(generics.RetrieveAPIView):
    queryset = Review.objects.select_related('reviewer', 'gig', 'order')
    serializer_class = ReviewSerializer
    permission_classes = [permissions.AllowAny]
