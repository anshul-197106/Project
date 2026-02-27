from rest_framework import serializers
from .models import Order
from gigs.serializers import GigListSerializer
from accounts.serializers import UserSerializer


class OrderSerializer(serializers.ModelSerializer):
    gig_detail = GigListSerializer(source='gig', read_only=True)
    buyer_detail = UserSerializer(source='buyer', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'gig', 'gig_detail', 'buyer', 'buyer_detail',
            'status', 'requirements', 'amount',
            'created_at', 'updated_at', 'delivered_at',
        ]
        read_only_fields = ['buyer', 'amount', 'delivered_at']


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'gig', 'requirements']

    def create(self, validated_data):
        gig = validated_data['gig']
        validated_data['buyer'] = self.context['request'].user
        validated_data['amount'] = gig.price
        return super().create(validated_data)

    def validate_gig(self, value):
        user = self.context['request'].user
        if value.seller == user:
            raise serializers.ValidationError("You cannot order your own gig.")
        if not value.is_active:
            raise serializers.ValidationError("This gig is not currently active.")
        return value


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'status']
