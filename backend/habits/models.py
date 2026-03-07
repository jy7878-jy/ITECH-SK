from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import Q


class Habit(models.Model):
    FREQUENCY_CHOICES = [
        ("daily", "Daily"),
        ("weekly", "Weekly"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="habits",
    )

    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    frequency_type = models.CharField(
        max_length=10,
        choices=FREQUENCY_CHOICES,
        default="daily",
    )

    goal_per_week = models.PositiveSmallIntegerField(
        default=7,
        validators=[MinValueValidator(1), MaxValueValidator(7)],
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "title"], name="uniq_user_title"),
            models.CheckConstraint(
                condition=Q(goal_per_week__gte=1) & Q(goal_per_week__lte=7),
                name="chk_goal_per_week_1_7",
            ),
        ]

    def __str__(self):
        return self.title


class CheckIn(models.Model):
    STATUS_CHOICES = [
        ("done", "Done"),
        ("not_done", "Not done"),
    ]

    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name="checkins",
    )

    checkin_date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="done")
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["habit", "checkin_date"], name="uniq_habit_day"),
        ]
        indexes = [
            models.Index(fields=["habit", "checkin_date"], name="idx_habit_date"),
            models.Index(fields=["checkin_date"], name="idx_checkin_date"),
        ]

    def __str__(self):
        return f"{self.habit.title} @ {self.checkin_date} = {self.status}"