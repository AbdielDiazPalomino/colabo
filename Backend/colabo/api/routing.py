from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # ws://localhost:8000/ws/board/b_12345/
    re_path(r'ws/board/(?P<board_id>\w+)/$', consumers.BoardConsumer.as_asgi()),
]