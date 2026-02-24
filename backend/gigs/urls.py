from django.urls import path
from . import views

urlpatterns = [
    path('', views.GigListCreateView.as_view(), name='gig_list_create'),
    path('categories/', views.CategoryListView.as_view(), name='category_list'),
    path('featured/', views.FeaturedGigsView.as_view(), name='featured_gigs'),
    path('my-gigs/', views.MyGigsView.as_view(), name='my_gigs'),
    path('<int:pk>/', views.GigDetailView.as_view(), name='gig_detail'),
]
