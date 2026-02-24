from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, min_length=6)
    is_freelancer = serializers.BooleanField(default=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password2', 'is_freelancer']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        is_freelancer = validated_data.pop('is_freelancer', False)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_freelancer=is_freelancer,
            is_buyer=True,
        )
        Profile.objects.create(user=user, full_name=user.username)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_freelancer', 'is_buyer', 'date_joined']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    skills_list = serializers.ListField(read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'full_name', 'bio', 'avatar', 'skills', 'skills_list',
            'hourly_rate', 'portfolio_url', 'location', 'phone', 'tagline',
            'languages', 'education', 'experience_years', 'total_earnings',
            'total_orders_completed', 'average_rating', 'created_at', 'updated_at',
        ]
        read_only_fields = ['total_earnings', 'total_orders_completed', 'average_rating']


class PublicProfileSerializer(serializers.ModelSerializer):
    """Limited profile info for public viewing."""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    is_freelancer = serializers.BooleanField(source='user.is_freelancer', read_only=True)
    member_since = serializers.DateTimeField(source='user.date_joined', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id', 'username', 'email', 'is_freelancer', 'member_since',
            'full_name', 'bio', 'avatar', 'skills', 'skills_list',
            'hourly_rate', 'portfolio_url', 'location', 'tagline',
            'languages', 'education', 'experience_years',
            'total_orders_completed', 'average_rating',
        ]
