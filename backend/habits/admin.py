from django.contrib import admin

from .models import Habit, CheckIn

@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "frequency_type", "goal_per_week", "is_active", "created_at")
    list_filter = ("frequency_type", "is_active")
    search_fields = ("title", "user__username", "user__email")

@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ("id", "habit", "checkin_date", "status", "created_at")
    list_filter = ("status", "checkin_date")
    search_fields = ("habit__title",)
