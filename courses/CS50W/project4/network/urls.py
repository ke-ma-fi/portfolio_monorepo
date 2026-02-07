
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("<int:post_id>", views.post, name="post"),
    path("<str:action>", views.get_timeline, name="timeline"),
    path("user/<int:user_id>", views.get_user, name="user"),
    path("like/<int:post_id>", views.like, name="like")
]
