from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with email as the primary identifier."""
    email = models.EmailField(unique=True)
    is_freelancer = models.BooleanField(default=False)
    is_buyer = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email


class Profile(models.Model):
    """Extended profile for users."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=200, blank=True)
    bio = models.TextField(max_length=1000, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    saved_gigs = models.ManyToManyField('gigs.Gig', related_name='saved_by', blank=True)
    stripe_account_id = models.CharField(max_length=100, blank=True, help_text='Stripe Connect Account ID')
    skills = models.CharField(max_length=500, blank=True, help_text='Comma-separated skills')
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    portfolio_url = models.URLField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    tagline = models.CharField(max_length=300, blank=True, help_text='Short professional tagline')
    languages = models.CharField(max_length=300, blank=True, help_text='Comma-separated languages')
    education = models.CharField(max_length=500, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_orders_completed = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.username}"

    @property
    def skills_list(self):
        return [s.strip() for s in self.skills.split(',') if s.strip()] if self.skills else []
