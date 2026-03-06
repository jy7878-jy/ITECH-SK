from django.test import TestCase, Client
from django.contrib.auth import get_user_model

from .models import Habit, CheckIn

User = get_user_model()


class HabitModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="12345678"
        )

    def test_create_habit(self):
        habit = Habit.objects.create(
            user=self.user,
            title="Drink Water",
            description="8 cups",
            frequency_type="daily",
            goal_per_week=7
        )

        self.assertEqual(habit.title, "Drink Water")
        self.assertEqual(habit.user, self.user)
        self.assertEqual(habit.frequency_type, "daily")
        self.assertEqual(habit.goal_per_week, 7)


class CheckInModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="12345678"
        )
        self.habit = Habit.objects.create(
            user=self.user,
            title="Morning Run",
            description="Run 15 minutes",
            frequency_type="daily",
            goal_per_week=5
        )

    def test_create_checkin(self):
        checkin = CheckIn.objects.create(
            habit=self.habit,
            checkin_date="2026-03-06",
            status="done",
            note="good day"
        )

        self.assertEqual(checkin.habit, self.habit)
        self.assertEqual(checkin.status, "done")
        self.assertEqual(checkin.note, "good day")


class HabitApiTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="testuser",
            password="12345678"
        )

    def test_habit_create_api(self):
        response = self.client.post(
            "/api/habits/create/",
            data='{"title": "Read Books", "description": "20 minutes", "frequency_type": "daily", "goal_per_week": 7}',
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Habit.objects.count(), 1)
        self.assertEqual(Habit.objects.first().title, "Read Books")

    def test_habits_list_api(self):
        Habit.objects.create(
            user=self.user,
            title="Study",
            description="Study 1 hour",
            frequency_type="daily",
            goal_per_week=6
        )

        response = self.client.get("/api/habits/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Study")

    def test_checkin_api(self):
        habit = Habit.objects.create(
            user=self.user,
            title="Exercise",
            description="Gym session",
            frequency_type="daily",
            goal_per_week=5
        )

        response = self.client.post(
            f"/api/habits/{habit.id}/checkin/",
            data='{"date": "2026-03-06", "status": "done", "note": "great"}',
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(CheckIn.objects.count(), 1)
        self.assertEqual(CheckIn.objects.first().status, "done")