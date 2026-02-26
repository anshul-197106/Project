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
