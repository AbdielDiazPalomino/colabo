from rest_framework import serializers
from .models import Board, Column, Card, Note, GuestUser

class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = '__all__'

class ColumnSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True)
    
    class Meta:
        model = Column
        fields = ['id', 'name', 'color', 'order', 'cards']

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = '__all__'

class BoardSerializer(serializers.ModelSerializer):
    columns = ColumnSerializer(many=True, read_only=True)
    notes = NoteSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = ['id', 'name', 'color', 'emoji', 'password', 'created_at', 'updated_at', 'columns', 'notes']
        extra_kwargs = {
            'password': {'write_only': True} # Para que la contraseña no se envíe al frontend
        }