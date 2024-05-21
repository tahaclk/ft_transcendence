from django.urls import path
from viewApi.views import profile

urlpatterns = [
    path('<slug:username>', profile),
]
