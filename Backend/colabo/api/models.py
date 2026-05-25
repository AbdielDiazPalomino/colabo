from django.db import models
import uuid

class GuestUser(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    display_name = models.CharField(max_length=50, default="Invitado")
    created_at = models.DateTimeField(auto_now_add=True)

class Board(models.Model):
    id = models.CharField(primary_key=True, max_length=50) # Usamos tu formato 'b_1234...'
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default="#6366f1")
    emoji = models.CharField(max_length=10, default="🚀")
    password = models.CharField(max_length=128, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Column(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    board = models.ForeignKey(Board, related_name='columns', on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default="#6366f1")
    order = models.IntegerField(default=0)

class Card(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    column = models.ForeignKey(Column, related_name='cards', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    desc = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=20, default="none")
    tag = models.CharField(max_length=50, blank=True, null=True)
    assignee = models.CharField(max_length=50, blank=True, null=True) # Nombre por ahora
    progress = models.IntegerField(default=0)
    color = models.CharField(max_length=20, blank=True, null=True)
    due_date = models.DateField(null=True, blank=True)
    done = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

class Note(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    board = models.ForeignKey(Board, related_name='notes', on_delete=models.CASCADE)
    text = models.TextField()
    color = models.CharField(max_length=20, default="#fef3c7")
    x = models.FloatField(default=200)
    y = models.FloatField(default=200)