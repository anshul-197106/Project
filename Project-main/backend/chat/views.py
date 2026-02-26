from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from accounts.models import User

class ConversationListView(generics.ListAPIView):
    """List all conversations for the authenticated user."""
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return self.request.user.conversations.all()

class ConversationCreateView(APIView):
    """Create a conversation with another user or return an existing one."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        other_user_id = request.data.get('user_id')
        gig_id = request.data.get('gig_id')
        
        if not other_user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        other_user = get_object_or_404(User, id=other_user_id)
        
        if other_user == request.user:
            return Response({'error': 'Cannot create a conversation with yourself'}, status=status.HTTP_400_BAD_REQUEST)

        # Base filter: both users are participants
        conversations = Conversation.objects.filter(participants=request.user).filter(participants=other_user)
        
        # If gig_id is provided, specifically look for/create a conversation for that gig
        if gig_id:
            conversation = conversations.filter(gig_id=gig_id).first()
            if not conversation:
                conversation = Conversation.objects.create(gig_id=gig_id)
                conversation.participants.add(request.user, other_user)
        else:
            # Look for a general conversation (gig_id is null)
            conversation = conversations.filter(gig_id__isnull=True).first()
            if not conversation:
                conversation = Conversation.objects.create()
                conversation.participants.add(request.user, other_user)

        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class MessageListCreateView(generics.ListCreateAPIView):
    """List messages for a conversation and create new messages."""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        conversation_id = self.kwargs.get('pk')
        conversation = get_object_or_404(Conversation, pk=conversation_id)
        
        # Verify user is a participant
        if self.request.user not in conversation.participants.all():
            return Message.objects.none()
            
        return conversation.messages.all()

    def perform_create(self, serializer):
        conversation_id = self.kwargs.get('pk')
        conversation = get_object_or_404(Conversation, pk=conversation_id)
        serializer.save(sender=self.request.user, conversation=conversation)
        
        # Update conversation's updated_at timestamp natively
        conversation.save()

class MarkMessagesReadView(APIView):
    """Mark all unread messages in a conversation as read for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        conversation = get_object_or_404(Conversation, pk=pk)
        
        # Verify user is a participant
        if request.user not in conversation.participants.all():
            return Response({'error': 'Not part of this conversation'}, status=status.HTTP_403_FORBIDDEN)

        unread_messages = conversation.messages.exclude(sender=request.user).filter(is_read=False)
        updated_count = unread_messages.update(is_read=True)
        
        return Response({'success': True, 'updated': updated_count}, status=status.HTTP_200_OK)
