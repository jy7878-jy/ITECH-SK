from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from habits.models import CheckIn, Habit

User = get_user_model()

class HabitApiTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username="testuser", password="12345678")
        self.client.force_login(self.user)

    def test_habit_create_api(self):
        response = self.client.post(
            "/api/habits/create/",
            data='{"title": "Read Books", "description": "20 minutes", "frequency": "daily", "goal_per_week": 7}',
            content_type="application/json",
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
            goal_per_week=6,
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
            goal_per_week=5,
        )

        response = self.client.post(
            f"/api/habits/{habit.id}/checkin/",
            data='{"date": "2026-03-06", "status": "done", "note": "great"}',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(CheckIn.objects.count(), 1)
        self.assertEqual(CheckIn.objects.first().status, "done")