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
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from gigs.models import Gig
import stripe
from decimal import Decimal

stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateCheckoutSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        gig_id = request.data.get('gig_id')
        requirements = request.data.get('requirements', '')
        
        gig = get_object_or_404(Gig, id=gig_id)
        buyer = request.user
        
        if gig.seller == buyer:
            return Response({'error': 'You cannot order your own gig.'}, status=status.HTTP_400_BAD_REQUEST)
        if not gig.is_active:
            return Response({'error': 'This gig is not active.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Optional: check if seller has connected Stripe account
        # if not gig.seller.profile.stripe_account_id:
        #    return Response({'error': 'Seller cannot receive payments yet.'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate platform fee (10%)
        amount = gig.price
        fee_percentage = Decimal(settings.STRIPE_PLATFORM_FEE_PERCENTAGE) / Decimal(100)
        platform_fee = amount * fee_percentage
        
        # Create Order in DB as payment_pending
        order = Order.objects.create(
            gig=gig,
            buyer=buyer,
            status='payment_pending',
            requirements=requirements,
            amount=amount,
            platform_fee=platform_fee
        )
        
        # Determine success/cancel URLs based on request origin
        domain = request.headers.get('origin', 'http://localhost:5173')

        try:
            # Create Stripe Checkout Session
            session_data = {
                'payment_method_types': ['card'],
                'line_items': [{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': gig.title,
                            'description': f"Order from {gig.seller.username}",
                        },
                        'unit_amount': int(amount * 100),  # Stripe expects cents
                    },
                    'quantity': 1,
                }],
                'mode': 'payment',
                'success_url': f"{domain}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
                'cancel_url': f"{domain}/gigs/{gig.id}",
                'metadata': {
                    'order_id': order.id
                }
            }
            
            # If seller has a Stripe account, route the money to them (minus our fee)
            seller_stripe_account = gig.seller.profile.stripe_account_id
            if seller_stripe_account:
                session_data['payment_intent_data'] = {
                    'transfer_data': {
                        'destination': seller_stripe_account,
                    },
                    'application_fee_amount': int(platform_fee * 100),
                }
                
            session = stripe.checkout.Session.create(**session_data)
            
            # Save the session ID on order for future reference
            order.stripe_payment_intent_id = session.id
            order.save()
            
            return Response({'checkout_url': session.url, 'order_id': order.id})
            
        except Exception as e:
            order.delete()  # Clean up the pending order since payment failed to init
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]  # Stripe doesn't use our authentication

    def post(self, request):
        payload = request.body
        sig_header = request.headers.get('Stripe-Signature')
        event = None

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            # Invalid payload
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            return Response(status=status.HTTP_400_BAD_REQUEST)

        # Handle the checkout.session.completed event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            order_id = session.get('metadata', {}).get('order_id')
            
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                    order.status = 'pending'  # Payment secured, move to active pending state
                    order.save()
                except Order.DoesNotExist:
                    pass

        return Response(status=status.HTTP_200_OK)
