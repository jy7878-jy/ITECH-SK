"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from habits import views

urlpatterns = [
    path("admin/", admin.site.urls),

    # old page routes now redirect to frontend
    path("", views.dashboard_view, name="dashboard"),
    path("login/", views.login_page_redirect, name="login"),
    path("register/", views.register_view, name="register"),

    # auth APIs
    path("api/login/", views.login_api, name="login_api"),
    path("api/register/", views.register_api, name="register_api"),
    path("api/logout/", views.logout_api, name="logout_api"),
    path("api/me/", views.me_api, name="me_api"),

    # habits APIs
    path("api/habits/", include("habits.urls")),
]