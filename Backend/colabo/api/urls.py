from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BoardViewSet, ColumnViewSet, CardViewSet, NoteViewSet

router = DefaultRouter()
router.register(r'boards', BoardViewSet)
router.register(r'columns', ColumnViewSet)
router.register(r'cards', CardViewSet)
router.register(r'notes', NoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]