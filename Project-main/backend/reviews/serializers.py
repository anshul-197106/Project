from rest_framework import serializers
from .models import Review
from accounts.serializers import UserSerializer


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_detail = UserSerializer(source='reviewer', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'order', 'gig', 'reviewer', 'reviewer_detail', 'rating', 'comment', 'created_at']
        read_only_fields = ['reviewer', 'gig']


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'order', 'rating', 'comment']

    def validate_order(self, value):
        user = self.context['request'].user
        if value.buyer != user:
            raise serializers.ValidationError("You can only review orders you purchased.")
        if value.status != 'completed':
            raise serializers.ValidationError("You can only review completed orders.")
        if hasattr(value, 'review'):
            raise serializers.ValidationError("This order has already been reviewed.")
        return value

    def create(self, validated_data):
        order = validated_data['order']
        validated_data['reviewer'] = self.context['request'].user
        validated_data['gig'] = order.gig
        return super().create(validated_data)
