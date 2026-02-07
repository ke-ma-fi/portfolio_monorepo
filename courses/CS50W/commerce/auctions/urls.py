from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("addlisting", views.add_listing, name='addlisting'),
    path("details/<int:listing_id>", views.details, name="detailview"),
    path("watch", views.watch, name='watch'),
    path("categories/<str:category>", views.categories, name='categories'),
    path("close", views.close, name='close'),
    path("comment", views.comment, name='comment')
]
