from django.urls import path
from . import api

urlpatterns = [
    path("", api.habits_list),
    path("create/", api.habit_create),
    path("<int:habit_id>/checkin/", api.checkin),
    path("<int:habit_id>/delete/", api.habit_delete),
]