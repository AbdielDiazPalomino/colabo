from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Board, Column, Card, Note
from .serializers import BoardSerializer, ColumnSerializer, CardSerializer, NoteSerializer

class BoardViewSet(viewsets.ModelViewSet):
    queryset = Board.objects.all()
    serializer_class = BoardSerializer

    @action(detail=True, methods=['post'])
    def verify_password(self, request, pk=None):
        board = self.get_object()
        password = request.data.get('password')
        if board.password and board.password == password:
            return Response({'status': 'Acceso concedido'})
        return Response({'error': 'Contraseña incorrecta'}, status=status.HTTP_403_FORBIDDEN)

class ColumnViewSet(viewsets.ModelViewSet):
    queryset = Column.objects.all()
    serializer_class = ColumnSerializer

class CardViewSet(viewsets.ModelViewSet):
    queryset = Card.objects.all()
    serializer_class = CardSerializer

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer