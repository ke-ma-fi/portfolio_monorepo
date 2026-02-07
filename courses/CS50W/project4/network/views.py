from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from .wrappers import user_owns_post
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from django.core.paginator import Paginator
from .forms import PostForm
from .models import User, Post, Follow
import json



def index(request):
    """
    Renders the main social network page.
    Handles the creation of new posts via POST request.
    """
    if request.method == 'POST':
        form = PostForm(request.POST)
        if form.is_valid:
            post = form.save(commit=False)
            post.user = request.user
            post.save()
            return redirect('index')
        else:
            return render(request, "network/index.html", {
            'PostForm': form
        })
    else:
        return render(request, "network/index.html", {
            'PostForm': PostForm
        })
    

@csrf_exempt
def post(request, post_id):
    """
    API endpoint to GET, PUT (edit), or DELETE a specific post.
    Access control is enforced to ensure only the author can edit/delete.
    """
    user = request.user
    try:
        post = Post.objects.get(pk=post_id)
    except Post.DoesNotExist:
        return JsonResponse({
            'message': 'Post does not exist!'
        }, status=404)
    
    if request.method == 'GET':
        return JsonResponse(post.serialize(user))
    
    elif request.method == 'PUT' and user.owns_post(post_id):
        data = json.loads(request.body)
        for key, value in data.items():
            if data.get(key) is not None:
                setattr(post, key, value)
        post.save()
        return JsonResponse(post.serialize(user), status=200)

    elif request.method == 'DELETE' and user.owns_post(post_id):
        post.delete()
        return JsonResponse({
            'message': 'Post was deleted successfully!'
        }, status=204)
    
    else:
        return JsonResponse({
            'message': 'GET, PUT or DELETE request required!'
        }, status=400)

@csrf_exempt
def get_timeline(request, action):
    """
    API endpoint for retrieving posts with pagination.
    Actions: 'all' (all posts), 'following' (posts from followed users), 'user' (posts from a specific user).
    """
    user = request.user
    
    page = request.GET.get('page')
    if not page or page == '0':
        page = 1
    
    if not action:
        action = "all"

    # Filter posts based on the requested timeline view
    if action == "all":
        posts = Post.objects.all()

    elif action == "following":
        followed_users = user.following.all()
        posts = Post.objects.filter(user__in=followed_users)

    elif action == "user":
        user_id = request.GET.get('id')
        if user_id is None:
            return JsonResponse({'message': 'No user found.'})
        posts = Post.objects.filter(user=User.objects.get(pk=user_id))

    else:
        return JsonResponse({'message': 'No action found'})

    post_list = posts.order_by('-created').all()
    
    # Process posts for JSON transfer
    all_posts = [post.serialize(user) for post in post_list]

    # Manage pagination (10 posts per page)
    p = Paginator(all_posts, 10)
    try:
        page_obj = p.page(page)
    except Exception:
        page_obj = p.page(1)

    payload = {
        'posts': page_obj.object_list,
        'pagination': {
            'current_page': page_obj.number,
            'total_pages': p.num_pages,
        }
    }

    return JsonResponse(payload, safe=False)

@login_required (login_url='/login')
@csrf_exempt
def like(request, post_id):
    user = request.user
    post = Post.objects.get(pk=post_id)

    if user in post.likes.all():
        post.likes.remove(user)
    else:
        post.likes.add(user)

    post.likes_count = post.likes.count()
    post.save()

    return JsonResponse({
        'message': 'updated likes sucessfully!'
    }, status=200)

@csrf_exempt
def get_user(request, user_id):
    if request.user.is_authenticated:
        user = request.user
    else:
        user = False


    other_user = User.objects.get(pk=user_id)
    
    if not other_user:
           return JsonResponse({
               'message': 'User not found! Invalid user id.'
           }, status=404)
    
    if request.method == 'GET':
       return JsonResponse(other_user.serialize(user), status=200)
    
    elif request.method == 'PUT' and not user == other_user and user.is_authenticated:
        follow, created = Follow.objects.get_or_create(
        following_user=user,
        followed_user=other_user)
        if created:
            follow.save()
            return JsonResponse({
                'message': 'User created!'
            }, status=200)
        else:
            return JsonResponse({
                'message': 'Something went wrong'
            }, status=500)

    elif request.method == 'DELETE' and not user == other_user and user.is_authenticated:
        try:
            Follow.objects.get(following_user=user, followed_user=other_user).delete()
        except Follow.DoesNotExist:
            return JsonResponse({
                'message': 'Follow connection does not exist'
            }, status=500)
        return JsonResponse({
            'message': 'Unfollow sucessful!'
        }, status=200)

    else:
        return JsonResponse({
            'message': 'Only GET, PUT and DELETE possible. PUT and DELETE only for other user ids than your own user id!'
        }, status=404)
    
def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
