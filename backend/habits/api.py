import json
from datetime import date, timedelta

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import IntegrityError
from django.db.models import Sum

from .models import Habit, CheckIn


# -------------------------
# Get habit list
# GET /api/habits/
# -------------------------
def habits_list(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "login required"}, status=401)

    habits = Habit.objects.filter(user=request.user, is_active=True)

    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    data = []
    for habit in habits:
        today_record = CheckIn.objects.filter(
            habit=habit,
            checkin_date=today,
            status="done"
        ).first()

        done_today = bool(today_record)

        weekly_progress = CheckIn.objects.filter(
            habit=habit,
            checkin_date__range=(start_of_week, end_of_week),
            status="done"
        ).aggregate(total=Sum("count"))["total"] or 0

        today_count = today_record.count if today_record else 0

        data.append({
            "id": habit.id,
            "title": habit.title,
            "description": habit.description,
            "frequency": habit.frequency_type,
            "goal_per_week": habit.goal_per_week,
            "done_today": done_today,
            "weekly_progress": weekly_progress,
            "today_count": today_count,
        })

    return JsonResponse({"habits": data})


# -------------------------
# Create a new habit
# POST /api/habits/create/
# -------------------------
@require_http_methods(["POST"])
def habit_create(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "login required"}, status=401)

    user = request.user

    try:
        body = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    title = body.get("title", "").strip()
    if not title:
        return JsonResponse({"error": "title is required"}, status=400)

    description = body.get("description", "").strip()
    frequency = body.get("frequency", "daily")
    goal = body.get("goal_per_week", 1)

    if frequency not in ["daily", "weekly"]:
        return JsonResponse({"error": "frequency must be daily or weekly"}, status=400)

    try:
        goal = int(goal)
    except (TypeError, ValueError):
        return JsonResponse({"error": "goal_per_week must be a number"}, status=400)

    if goal < 1:
        return JsonResponse({"error": "goal_per_week must be at least 1"}, status=400)

    # Daily habits do not really need a weekly target from UI.
    # Keep it as 1 internally for simplicity.
    if frequency == "daily":
        goal = 1

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
# Save or update progress
# POST /api/habits/<id>/checkin/
# -------------------------
@require_http_methods(["POST"])
def checkin(request, habit_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "login required"}, status=401)

    user = request.user

    try:
        body = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        habit = Habit.objects.get(id=habit_id, user=user, is_active=True)
    except Habit.DoesNotExist:
        return JsonResponse({"error": "habit not found"}, status=404)

    checkin_date = body.get("date")
    note = body.get("note", "").strip()

    if not checkin_date:
        return JsonResponse({"error": "date is required"}, status=400)

    try:
        existing = CheckIn.objects.filter(
            habit=habit,
            checkin_date=checkin_date
        ).first()

        # DAILY: only one completion per day
        if habit.frequency_type == "daily":
            if existing:
                existing.status = "done"
                existing.count = 1
                existing.note = note
                existing.save()
                created = False
                checkin = existing
            else:
                checkin = CheckIn.objects.create(
                    habit=habit,
                    checkin_date=checkin_date,
                    status="done",
                    count=1,
                    note=note
                )
                created = True

            return JsonResponse({
                "message": "daily checkin saved",
                "id": checkin.id,
                "created": created,
                "count": checkin.count
            })

        # WEEKLY: same day can accumulate multiple times
        if habit.frequency_type == "weekly":
            if existing:
                existing.status = "done"
                existing.count += 1
                existing.note = note
                existing.save()
                created = False
                checkin = existing
            else:
                checkin = CheckIn.objects.create(
                    habit=habit,
                    checkin_date=checkin_date,
                    status="done",
                    count=1,
                    note=note
                )
                created = True

            return JsonResponse({
                "message": "weekly progress added",
                "id": checkin.id,
                "created": created,
                "count": checkin.count
            })

        return JsonResponse({"error": "invalid habit frequency"}, status=400)

    except Exception as e:
        # Hide raw python exception trace from client
        return JsonResponse({
            "error": "An internal error occurred while saving your check-in."
        }, status=500)


# -------------------------
# Delete a habit
# POST /api/habits/<id>/delete/
# -------------------------
@require_http_methods(["POST"])
def habit_delete(request, habit_id):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "login required"}, status=401)

    try:
        habit = Habit.objects.get(id=habit_id, user=request.user, is_active=True)
    except Habit.DoesNotExist:
        return JsonResponse({"error": "habit not found"}, status=404)

    habit.is_active = False
    habit.save()

    return JsonResponse({"message": "habit deleted"})