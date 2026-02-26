from django.urls import path
from . import views

urlpatterns = [
    path('', views.GigListCreateView.as_view(), name='gig_list_create'),
    path('categories/', views.CategoryListView.as_view(), name='category_list'),
    path('featured/', views.FeaturedGigsView.as_view(), name='featured_gigs'),
    path('saved/', views.SavedGigsListView.as_view(), name='saved_gigs'),
    path('my-gigs/', views.MyGigsView.as_view(), name='my_gigs'),
    path('<int:pk>/', views.GigDetailView.as_view(), name='gig_detail'),
    path('<int:pk>/save/', views.ToggleSaveGigView.as_view(), name='toggle_save_gig'),
]
