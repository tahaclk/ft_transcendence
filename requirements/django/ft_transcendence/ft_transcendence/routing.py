from django.core.asgi import get_asgi_application
from django.urls import path, re_path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from ft_transcendence.consumers import ChatConsumer
from ft_transcendence.gameConsumers import GameConsumer
from ft_transcendence.tournamentConsumers import TournamentConsumer

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AuthMiddlewareStack(
            URLRouter(
                [
                    path("ws/chat/", ChatConsumer.as_asgi()),
                    re_path(r"ws/game/(?P<room_name>[A-Za-z0-9_-]+)/(?P<token>[A-Za-z0-9_-]+)/$", GameConsumer.as_asgi()),
                    path(r"ws/tournament/", TournamentConsumer.as_asgi()),
                ]
            )
        ),
    }
)
