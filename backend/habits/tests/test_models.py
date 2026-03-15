from django.contrib.auth import get_user_model
from django.test import TestCase
from habits.models import CheckIn, Habit

User = get_user_model()

class HabitModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="12345678")

    def test_create_habit(self):
        habit = Habit.objects.create(
            user=self.user,
            title="Drink Water",
            description="8 cups",
            frequency_type="daily",
            goal_per_week=7,
        )

        self.assertEqual(habit.title, "Drink Water")
        self.assertEqual(habit.user, self.user)
        self.assertEqual(habit.frequency_type, "daily")
        self.assertEqual(habit.goal_per_week, 7)


class CheckInModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="12345678")
        self.habit = Habit.objects.create(
            user=self.user,
            title="Morning Run",
            description="Run 15 minutes",
            frequency_type="daily",
            goal_per_week=5,
        )

    def test_create_checkin(self):
        checkin = CheckIn.objects.create(
            habit=self.habit,
            checkin_date="2026-03-06",
            status="done",
            note="good day",
        )

        self.assertEqual(checkin.habit, self.habit)
        self.assertEqual(checkin.status, "done")
        self.assertEqual(checkin.note, "good day")