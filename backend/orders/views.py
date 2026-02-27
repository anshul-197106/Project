from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer, OrderStatusSerializer


class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        role = self.request.query_params.get('role', 'buyer')
        if role == 'seller':
            return Order.objects.filter(gig__seller=user).select_related('gig', 'buyer', 'gig__category')
        return Order.objects.filter(buyer=user).select_related('gig', 'buyer', 'gig__category')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Order.objects.filter(
            models.Q(buyer=user) | models.Q(gig__seller=user)
        ).select_related('gig', 'buyer', 'gig__category')


class OrderStatusUpdateView(generics.UpdateAPIView):
    """Update order status (seller can update to in_progress/delivered, buyer can complete/cancel)."""
    serializer_class = OrderStatusSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.all()

    def perform_update(self, serializer):
        order = self.get_object()
        new_status = serializer.validated_data.get('status')
        user = self.request.user

        # Seller actions
        if order.gig.seller == user:
            if new_status == 'in_progress' and order.status == 'pending':
                serializer.save()
            elif new_status == 'delivered' and order.status == 'in_progress':
                serializer.save(delivered_at=timezone.now())
            else:
                return Response({'error': 'Invalid status transition.'}, status=status.HTTP_400_BAD_REQUEST)

        # Buyer actions
        elif order.buyer == user:
            if new_status == 'completed' and order.status == 'delivered':
                serializer.save()
                # Update gig stats
                gig = order.gig
                gig.total_orders += 1
                gig.save()
                # Update seller profile stats
                profile = gig.seller.profile
                profile.total_orders_completed += 1
                profile.total_earnings += order.amount
                profile.save()
            elif new_status == 'cancelled' and order.status in ('pending',):
                serializer.save()
            else:
                return Response({'error': 'Invalid status transition.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)


# Fix missing import
from django.db import models
