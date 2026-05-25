import json
from channels.generic.websocket import AsyncWebsocketConsumer

class BoardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.board_id = self.scope['url_route']['kwargs']['board_id']
        self.room_group_name = f'board_{self.board_id}'

        # Unirse al grupo de la pizarra
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Salir del grupo
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Recibir mensaje desde el frontend (tu JS)
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json['action'] # Ej: 'move_card', 'update_progress', 'new_note'
        data = text_data_json['data']

        # Enviar mensaje a todo el grupo (todos los conectados a esta pizarra)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'board_update',
                'action': action,
                'data': data
            }
        )

    # Recibir mensaje del grupo y enviarlo de vuelta al WebSocket (frontend)
    async def board_update(self, event):
        action = event['action']
        data = event['data']

        await self.send(text_data=json.dumps({
            'action': action,
            'data': data
        }))