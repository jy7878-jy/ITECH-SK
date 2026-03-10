import json

from django.contrib.auth import logout, authenticate, login
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm

FRONTEND_BASE_URL = "http://127.0.0.1:5500/frontend"


def dashboard_view(request):
    return redirect(f"{FRONTEND_BASE_URL}/index.html")


def login_page_redirect(request):
    return redirect(f"{FRONTEND_BASE_URL}/login.html")


def register_view(request):
    return redirect(f"{FRONTEND_BASE_URL}/register.html")


@csrf_exempt
@require_http_methods(["POST"])
def logout_api(request):
    logout(request)
    return JsonResponse({
        "success": True,
        "message": "logged out"
    })


@csrf_exempt
@require_http_methods(["POST"])
def register_api(request):
    try:
        body = json.loads(request.body)
    except Exception:
        return JsonResponse({
            "success": False,
            "error": "Invalid JSON"
        }, status=400)

    username = str(body.get("username", "")).strip()
    password1 = body.get("password1", "")
    password2 = body.get("password2", "")

    form = UserCreationForm({
        "username": username,
        "password1": password1,
        "password2": password2,
    })

    if form.is_valid():
        form.save()
        return JsonResponse({
            "success": True,
            "message": "registration successful",
            "redirect": "http://127.0.0.1:5500/frontend/login.html"
        }, status=200)

    errors = {}
    for field, field_errors in form.errors.items():
        errors[field] = [str(err) for err in field_errors]

    first_error = "Registration failed."
    for field_errors in errors.values():
        if field_errors:
            first_error = field_errors[0]
            break

    return JsonResponse({
        "success": False,
        "error": first_error,
        "errors": errors
    }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def login_api(request):
    try:
        body = json.loads(request.body)
    except Exception:
        return JsonResponse({
            "success": False,
            "error": "Invalid JSON"
        }, status=400)

    username = str(body.get("username", "")).strip()
    password = body.get("password", "")

    if not username or not password:
        return JsonResponse({
            "success": False,
            "error": "Username and password are required."
        }, status=400)

    user = authenticate(request, username=username, password=password)

    if user is None:
        return JsonResponse({
            "success": False,
            "error": "Invalid username or password."
        }, status=401)

    login(request, user)

    return JsonResponse({
        "success": True,
        "message": "login successful",
        "username": user.username,
        "redirect": "http://127.0.0.1:5500/frontend/index.html"
    }, status=200)


@require_http_methods(["GET"])
def me_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({
            "success": False,
            "error": "login required"
        }, status=401)

    return JsonResponse({
        "success": True,
        "username": request.user.username
    })