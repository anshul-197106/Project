from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import models
from django.conf import settings
from django.shortcuts import get_object_or_404
from decimal import Decimal
from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer, OrderStatusSerializer
from gigs.models import Gig


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


class SubmitDeliveryView(APIView):
    """
    Seller submits their work — upload a PDF and/or provide a GitHub link.
    This transitions the order from pending → delivered.
    """
    from rest_framework.parsers import MultiPartParser, FormParser
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        order = get_object_or_404(Order, id=pk)

        # Only the seller can submit work
        if order.gig.seller != request.user:
            return Response({'error': 'Only the seller can submit work for this order.'},
                            status=status.HTTP_403_FORBIDDEN)

        # Order must be in pending or in_progress state
        if order.status not in ('pending', 'in_progress'):
            return Response({'error': f'Cannot submit work for an order with status "{order.status}".'},
                            status=status.HTTP_400_BAD_REQUEST)

        github_link = request.data.get('github_link', '').strip()
        submission_note = request.data.get('submission_note', '').strip()
        submission_file = request.FILES.get('submission_file')

        # Must provide at least a file or a GitHub link
        if not submission_file and not github_link:
            return Response({'error': 'Please upload a PDF file or provide a GitHub link.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Validate file is a PDF if provided
        if submission_file:
            if not submission_file.name.lower().endswith('.pdf'):
                return Response({'error': 'Only PDF files are accepted.'},
                                status=status.HTTP_400_BAD_REQUEST)
            if submission_file.size > 10 * 1024 * 1024:  # 10MB limit
                return Response({'error': 'File size must be under 10MB.'},
                                status=status.HTTP_400_BAD_REQUEST)
            order.submission_file = submission_file

        if github_link:
            order.github_link = github_link
        if submission_note:
            order.submission_note = submission_note

        order.status = 'delivered'
        order.delivered_at = timezone.now()
        order.save()

        return Response({
            'message': 'Work submitted successfully! The buyer will be notified.',
            'order_id': order.id,
            'status': order.status,
            'github_link': order.github_link,
            'submission_file': order.submission_file.url if order.submission_file else None,
            'submission_note': order.submission_note,
        })


class DirectOrderView(APIView):
    """
    Create an order directly with simulated payment.
    This bypasses Stripe and creates a working order immediately.
    Used for development/demo — in production, replace with real payment gateway.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        gig_id = request.data.get('gig_id')
        requirements = request.data.get('requirements', '')
        
        if not gig_id:
            return Response({'error': 'gig_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        gig = get_object_or_404(Gig, id=gig_id)
        buyer = request.user

        if gig.seller == buyer:
            return Response({'error': 'You cannot order your own gig.'}, status=status.HTTP_400_BAD_REQUEST)
        if not gig.is_active:
            return Response({'error': 'This gig is not currently active.'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate platform fee (10%)
        amount = gig.price
        fee_percentage = Decimal(getattr(settings, 'STRIPE_PLATFORM_FEE_PERCENTAGE', 10)) / Decimal(100)
        platform_fee = amount * fee_percentage

        # Create Order — directly as 'pending' (payment is simulated as successful)
        order = Order.objects.create(
            gig=gig,
            buyer=buyer,
            status='pending',
            requirements=requirements,
            amount=amount,
            platform_fee=platform_fee,
            stripe_payment_intent_id=f'sim_{timezone.now().strftime("%Y%m%d%H%M%S")}_{gig.id}',
        )

        # Return order details
        return Response({
            'order_id': order.id,
            'status': order.status,
            'amount': str(order.amount),
            'platform_fee': str(order.platform_fee),
            'gig_title': gig.title,
            'seller': gig.seller.username,
            'message': 'Payment successful! Your order has been placed.',
        }, status=status.HTTP_201_CREATED)


class CreateCheckoutSessionView(APIView):
    """Stripe Checkout Session — requires real Stripe keys. Kept for production use."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
        except Exception:
            return Response({'error': 'Stripe is not configured.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        gig_id = request.data.get('gig_id')
        requirements = request.data.get('requirements', '')
        
        gig = get_object_or_404(Gig, id=gig_id)
        buyer = request.user
        
        if gig.seller == buyer:
            return Response({'error': 'You cannot order your own gig.'}, status=status.HTTP_400_BAD_REQUEST)
        if not gig.is_active:
            return Response({'error': 'This gig is not active.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = gig.price
        fee_percentage = Decimal(settings.STRIPE_PLATFORM_FEE_PERCENTAGE) / Decimal(100)
        platform_fee = amount * fee_percentage
        
        order = Order.objects.create(
            gig=gig,
            buyer=buyer,
            status='payment_pending',
            requirements=requirements,
            amount=amount,
            platform_fee=platform_fee
        )
        
        domain = request.headers.get('origin', 'http://localhost:5173')

        try:
            session_data = {
                'payment_method_types': ['card'],
                'line_items': [{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': gig.title,
                            'description': f"Order from {gig.seller.username}",
                        },
                        'unit_amount': int(amount * 100),
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
            
            seller_stripe_account = gig.seller.profile.stripe_account_id
            if seller_stripe_account:
                session_data['payment_intent_data'] = {
                    'transfer_data': {
                        'destination': seller_stripe_account,
                    },
                    'application_fee_amount': int(platform_fee * 100),
                }
                
            session = stripe.checkout.Session.create(**session_data)
            order.stripe_payment_intent_id = session.id
            order.save()
            
            return Response({'checkout_url': session.url, 'order_id': order.id})
            
        except Exception as e:
            order.delete()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
        except Exception:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        payload = request.body
        sig_header = request.headers.get('Stripe-Signature')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            order_id = session.get('metadata', {}).get('order_id')
            
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                    order.status = 'pending'
                    order.save()
                except Order.DoesNotExist:
                    pass

        return Response(status=status.HTTP_200_OK)
