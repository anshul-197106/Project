from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    """Review left by a buyer after completing an order."""
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='review')
    gig = models.ForeignKey('gigs.Gig', on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_given'
    )
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.reviewer.username} - {self.rating}★"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update gig average rating
        from django.db.models import Avg
        gig = self.gig
        avg = gig.reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        gig.average_rating = round(avg, 2)
        gig.save(update_fields=['average_rating'])
        # Update seller profile average rating
        seller_profile = gig.seller.profile
        from gigs.models import Gig
        seller_gigs = Gig.objects.filter(seller=gig.seller)
        overall_avg = Review.objects.filter(
            gig__in=seller_gigs
        ).aggregate(Avg('rating'))['rating__avg'] or 0
        seller_profile.average_rating = round(overall_avg, 2)
        seller_profile.save(update_fields=['average_rating'])
