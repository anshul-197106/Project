from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import Profile
from .serializers import (
    RegisterSerializer, ProfileSerializer, PublicProfileSerializer, UserSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Register a new user and return JWT tokens."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Registration successful!'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Login with email and password, return JWT tokens."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Please provide both email and password.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Login successful!'
        })


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated user's profile."""
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        return profile


class PublicProfileView(generics.RetrieveAPIView):
    """View any user's public profile by user ID."""
    serializer_class = PublicProfileSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'user_id'

    def get_queryset(self):
        return Profile.objects.select_related('user').all()

    def get_object(self):
        user_id = self.kwargs['user_id']
        try:
            return Profile.objects.select_related('user').get(user_id=user_id)
        except Profile.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Profile not found.')


class DashboardStatsView(APIView):
    """Get dashboard statistics for the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = Profile.objects.get_or_create(user=user)

        from gigs.models import Gig
        from orders.models import Order

        active_gigs = Gig.objects.filter(seller=user, is_active=True).count()
        total_gigs = Gig.objects.filter(seller=user).count()

        # Orders as seller
        seller_orders = Order.objects.filter(gig__seller=user)
        pending_orders = seller_orders.filter(status='pending').count()
        active_orders = seller_orders.filter(status='in_progress').count()
        completed_orders = seller_orders.filter(status='completed').count()

        # Orders as buyer
        buyer_orders = Order.objects.filter(buyer=user)
        my_purchases = buyer_orders.count()
        buyer_active_orders = buyer_orders.filter(status__in=['pending', 'in_progress', 'delivered']).count()
        total_spent = sum([order.amount for order in buyer_orders.filter(status='completed')])

        return Response({
            'total_earnings': float(profile.total_earnings),
            'total_spent': float(total_spent),
            'average_rating': float(profile.average_rating),
            'total_orders_completed': profile.total_orders_completed,
            'active_gigs': active_gigs,
            'total_gigs': total_gigs,
            'pending_orders': pending_orders,
            'active_orders': active_orders,
            'completed_orders': completed_orders,
            'my_purchases': my_purchases,
            'buyer_active_orders': buyer_active_orders,
        })


class FreelancerListView(generics.ListAPIView):
    """List all freelancer profiles."""
    serializer_class = PublicProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Profile.objects.filter(
            user__is_freelancer=True
        ).select_related('user').order_by('-average_rating')


# ===== ADMIN PANEL VIEWS =====

class AdminDashboardView(APIView):
    """Admin-only: platform-wide statistics."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from gigs.models import Gig
        from orders.models import Order
        from django.db.models import Sum, Count

        total_users = User.objects.count()
        total_freelancers = User.objects.filter(is_freelancer=True).count()
        total_buyers = User.objects.filter(is_buyer=True).count()
        total_gigs = Gig.objects.count()
        active_gigs = Gig.objects.filter(is_active=True).count()

        all_orders = Order.objects.all()
        total_orders = all_orders.count()
        pending_orders = all_orders.filter(status='pending').count()
        in_progress_orders = all_orders.filter(status='in_progress').count()
        delivered_orders = all_orders.filter(status='delivered').count()
        completed_orders = all_orders.filter(status='completed').count()
        cancelled_orders = all_orders.filter(status='cancelled').count()

        total_revenue = all_orders.filter(status='completed').aggregate(
            total=Sum('amount'))['total'] or 0
        total_platform_fees = all_orders.filter(status='completed').aggregate(
            total=Sum('platform_fee'))['total'] or 0

        return Response({
            'total_users': total_users,
            'total_freelancers': total_freelancers,
            'total_buyers': total_buyers,
            'total_gigs': total_gigs,
            'active_gigs': active_gigs,
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'in_progress_orders': in_progress_orders,
            'delivered_orders': delivered_orders,
            'completed_orders': completed_orders,
            'cancelled_orders': cancelled_orders,
            'total_revenue': float(total_revenue),
            'total_platform_fees': float(total_platform_fees),
        })


class AdminOrdersView(APIView):
    """Admin-only: view all orders and update their status."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from orders.models import Order
        from orders.serializers import OrderSerializer

        status_filter = request.query_params.get('status', None)
        orders = Order.objects.all().select_related('gig', 'buyer', 'gig__seller', 'gig__category')

        if status_filter:
            orders = orders.filter(status=status_filter)

        orders = orders.order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    def patch(self, request):
        """Admin can update any order's status."""
        from orders.models import Order
        from django.utils import timezone

        order_id = request.data.get('order_id')
        new_status = request.data.get('status')

        if not order_id or not new_status:
            return Response({'error': 'order_id and status are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        valid_statuses = ['pending', 'in_progress', 'delivered', 'completed', 'cancelled']
        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Choose from: {valid_statuses}'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        old_status = order.status
        order.status = new_status

        if new_status == 'delivered' and not order.delivered_at:
            order.delivered_at = timezone.now()

        if new_status == 'completed' and old_status != 'completed':
            gig = order.gig
            gig.total_orders += 1
            gig.save()
            profile = gig.seller.profile
            profile.total_orders_completed += 1
            profile.total_earnings += order.amount
            profile.save()

        order.save()

        return Response({
            'message': f'Order #{order.id} status updated to {new_status}.',
            'order_id': order.id,
            'old_status': old_status,
            'new_status': new_status,
        })


class AdminUsersView(APIView):
    """Admin-only: view all users."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        data = []
        for u in users:
            profile = getattr(u, 'profile', None)
            data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'is_freelancer': u.is_freelancer,
                'is_buyer': u.is_buyer,
                'is_staff': u.is_staff,
                'is_active': u.is_active,
                'date_joined': u.date_joined,
                'total_earnings': float(profile.total_earnings) if profile else 0,
                'total_orders_completed': profile.total_orders_completed if profile else 0,
            })
        return Response(data)
