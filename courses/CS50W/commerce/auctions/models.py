from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Category(models.Model):
    """Represents a category for auction listings (e.g., Electronics, Fashion)."""
    name = models.CharField(max_length=90, unique=True)

    def __str__(self):
        return f"{self.name}"

class Listing(models.Model):
    """
    Main auction item model. 
    Handles item details, starting price, highest bid tracking, and relationships with seller/watchers.
    """
    def get_def_cat():
        cat, created = Category.objects.get_or_create(name='No Category')
        return cat
    
    title = models.CharField(max_length=64, blank=False, null=False, unique=True)
    description = models.TextField(max_length=2000, blank=False, null=False)
    starting_bid = models.DecimalField(max_digits=8, decimal_places=2, blank=False, null=False)
    highest_bid = models.DecimalField(max_digits=8, decimal_places=2, blank=False, null=False, default=0)
    image = models.URLField(blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET(get_def_cat), default=get_def_cat, related_name='listings', null=True, blank=True)
    state = models.BooleanField(default=True)
    seller = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='listings', null=True)
    watchers = models.ManyToManyField(User, related_name='watched', null=True, blank=True)

    def __str__(self):
        return f"{self.seller}: {self.title}"
    
    def formatted_price(self):
        return "${:,.2f}".format(self.highest_bid)

class Bid(models.Model):
    price = models.DecimalField(max_digits=8, decimal_places=2, blank=False, null=False)
    bidder = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bids')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='bids')


class Comment(models.Model):
    comment = models.TextField(max_length=2000, null=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='comments')