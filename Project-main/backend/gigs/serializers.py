from rest_framework import serializers
from .models import Category, Gig
from accounts.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    gig_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description', 'gig_count']

    def get_gig_count(self, obj):
        return obj.gigs.filter(is_active=True).count()


class GigListSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags_list = serializers.ListField(read_only=True)
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Gig
        fields = [
            'id', 'seller', 'category', 'category_name', 'title',
            'description', 'price', 'delivery_days', 'image', 'tags',
            'tags_list', 'is_saved', 'is_active', 'revisions', 'total_orders',
            'average_rating', 'created_at',
        ]

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # We can optimize this by annotating the queryset in views instead.
            # But for simplicity, we check if the user's profile has this gig saved.
            profile = getattr(request.user, 'profile', None)
            if profile:
                return profile.saved_gigs.filter(id=obj.id).exists()
        return False



class GigDetailSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags_list = serializers.ListField(read_only=True)
    seller_profile = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Gig
        fields = [
            'id', 'seller', 'seller_profile', 'category', 'category_name',
            'title', 'description', 'price', 'delivery_days', 'image',
            'tags', 'tags_list', 'is_saved', 'is_active', 'revisions', 'total_orders',
            'average_rating', 'created_at', 'updated_at',
        ]


    def get_seller_profile(self, obj):
        from accounts.serializers import PublicProfileSerializer
        try:
            return PublicProfileSerializer(obj.seller.profile).data
        except Exception:
            return None

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            profile = getattr(request.user, 'profile', None)
            if profile:
                return profile.saved_gigs.filter(id=obj.id).exists()
        return False


class GigCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gig
        fields = [
            'id', 'category', 'title', 'description', 'price',
            'delivery_days', 'image', 'tags', 'revisions',
        ]

    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user
        return super().create(validated_data)
