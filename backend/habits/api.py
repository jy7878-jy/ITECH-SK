import json
from datetime import date

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.db import IntegrityError

from .models import Habit, CheckIn

User = get_user_model()


def get_test_user():
    """
    Temporarily get a test user.
    If no user exists in the database, create one automatically.
    """
    user = User.objects.first()
    if not user:
        user = User.objects.create(username="testuser")
    return user


# -------------------------
# Get habit list
# GET /api/habits/
# -------------------------
def habits_list(request):

    user = get_test_user()

    habits = Habit.objects.filter(user=user, is_active=True)

    data = []
    for habit in habits:
        data.append({
            "id": habit.id,
            "title": habit.title,
            "description": habit.description,
            "frequency": habit.frequency_type,
            "goal_per_week": habit.goal_per_week
        })

    return JsonResponse({"habits": data})


# -------------------------
# Create a new habit
# POST /api/habits/create/
# -------------------------
@csrf_exempt
@require_http_methods(["POST"])
def habit_create(request):

    user = get_test_user()

    try:
        body = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    title = body.get("title")
    if not title:
        return JsonResponse({"error": "title is required"}, status=400)

    description = body.get("description", "")
    frequency = body.get("frequency", "daily")
    goal = body.get("goal_per_week", 7)

    try:
        habit = Habit.objects.create(
            user=user,
            title=title,
            description=description,
            frequency_type=frequency,
            goal_per_week=goal
        )

        return JsonResponse({
            "message": "habit created",
            "id": habit.id
        })

    except IntegrityError:
        return JsonResponse({
            "error": "habit with this title already exists"
        }, status=400)


# -------------------------
# Save or update a check-in
# POST /api/habits/<id>/checkin/
# -------------------------
@csrf_exempt
@require_http_methods(["POST"])
def checkin(request, habit_id):

    user = get_test_user()

    try:
        body = json.loads(request.body)
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        habit = Habit.objects.get(id=habit_id, user=user)
    except Habit.DoesNotExist:
        return JsonResponse({"error": "habit not found"}, status=404)

    checkin_date = body.get("date")
    status = body.get("status", "done")
    note = body.get("note", "")

    if not checkin_date:
        return JsonResponse({"error": "date is required"}, status=400)

    try:
        # Update existing record if the same date exists, otherwise create a new one
        checkin, created = CheckIn.objects.update_or_create(
            habit=habit,
            checkin_date=checkin_date,
            defaults={
                "status": status,
                "note": note
            }
        )

        return JsonResponse({
            "message": "checkin saved",
            "id": checkin.id,
            "created": created
        })

    except Exception as e:
        return JsonResponse({
            "error": str(e)
        }, status=400)