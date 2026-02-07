from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    following = models.ManyToManyField('self', symmetrical=False, through='Follow')

    def serialize(self, user):
        return {
            'username': self.username,
            'followers_count': self.followers_link.all().count(),
            'following_count': self.following_link.all().count(),
            'followed': Follow.objects.filter(following_user=user, followed_user=self).exists(),
            'self': user == self, 
            'authenticated': user if not user else True
        }
    
    def owns_post(self, post_id):
        return self == Post.objects.get(pk=post_id).user

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    created = models.DateTimeField(default=timezone.now)
    updated = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)
    likes_count = models.IntegerField(default=0)

    def serialize(self, user):
        return {
            'id': self.id,
            'user_id': self.user.id,
            'user': self.user.username,
            'content': self.content,
            'created': self.created.strftime("%b %d %Y, %I:%M %p"),
            'updated': self.updated.strftime("%b %d %Y, %I:%M %p"),
            'likes_count': self.likes_count,
            'liked': user in self.likes.all(),
            'owned': user == self.user
        }

class Follow(models.Model):
    following_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_link')
    followed_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers_link')
    created = models.DateTimeField(default=timezone.now)
