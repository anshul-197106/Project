from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/create/', views.ConversationCreateView.as_view(), name='conversation-create'),
    path('conversations/<int:pk>/messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    path('conversations/<int:pk>/read/', views.MarkMessagesReadView.as_view(), name='mark-messages-read'),
]
