from django.db import models
from django.conf import settings


class Order(models.Model):
    """An order placed by a buyer for a gig."""
    STATUS_CHOICES = [
        ('payment_pending', 'Payment Pending'),
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('delivered', 'Delivered'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    gig = models.ForeignKey('gigs.Gig', on_delete=models.CASCADE, related_name='orders')
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='buyer_orders'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='payment_pending')
    requirements = models.TextField(blank=True, help_text='Buyer requirements for the order')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} - {self.gig.title} by {self.buyer.username}"
