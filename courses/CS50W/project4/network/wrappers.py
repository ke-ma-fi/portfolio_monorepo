from functools import wraps
from django.http import JsonResponse
from .models import Post
from django.shortcuts import get_object_or_404

def user_owns_post(function):
    @wraps(function)
    def wrap(request, *args, **kwargs):
        post = get_object_or_404(Post, pk=kwargs['post_id'])
        if post.user != request.user:
            return JsonResponse({
                'error': 'You are not allowed to edit this post!'
            }, status=400)
        return function(request, *args, **kwargs)
    return wrap