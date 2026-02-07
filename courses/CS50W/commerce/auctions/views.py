from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required

from .models import User, Category, Listing, Bid, Comment
from .forms import ListingForm, BiddingForm, CommentForm


def index(request):
    """Displays a list of all currently active auction listings."""
    active_listings = Listing.objects.filter(state=True).order_by('-id', )
    return render(request, "auctions/index.html", {
        'active_listings': active_listings
    })


def login_view(request):
    """Handles user authentication and session management."""
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
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "auctions/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    """Handles new user registration."""
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")

@login_required
def add_listing(request):
    """Allows authenticated users to create a new auction listing."""
    if request.method == 'POST':
        form = ListingForm(request.POST)
        
        if form.is_valid():
            newCategory = form.cleaned_data.get('newCategory')
            listing = form.save(commit=False)

            if newCategory:
                
                if not Category.objects.filter(name=newCategory).exists():
                    category = Category(name=newCategory)
                    category.save()
                else:
                    category, created = Category.objects.get_or_create(name=newCategory)

            else:
                category = form.cleaned_data.get('category')

                if not category:
                    category = Category.objects.get(name='No Category')

            listing.category = category    
            listing.seller = request.user
            listing.highest_bid = listing.starting_bid
            listing.save()    
            bid = Bid(price=listing.starting_bid, bidder=listing.seller, listing=listing)
            bid.save()
            return redirect('index')
        else: 
            return render(request, 'auctions/addlisting.html', {
            'ListingForm': form,
        })
        
    else:
        return render(request, 'auctions/addlisting.html', {
            'ListingForm': ListingForm(),
        })

def details(request, listing_id):
    """
    Shows detailed information about a specific listing.
    Handles bidding logic and watchlist status.
    """
    listing = Listing.objects.get(id=listing_id)
    if not listing:
        return redirect('index')
    user = request.user
    watched = user in listing.watchers.all()
    bidcount = listing.bids.count()-1
    highestbidder = Bid.objects.filter(listing=listing).order_by('-price').first().bidder
    comments = listing.comments.all()

    if request.method == 'POST':
        form = BiddingForm(request.POST)
        if form.is_valid:
            form.instance.bidder = request.user
            form.instance.listing = listing
            bid = form.save(commit=False)
            
            # Prevent users from bidding on their own auction
            if bid.bidder == listing.seller:
                form.add_error('price', 'You cannot bid on your own listing.')
                return render(request, 'auctions/details.html', {
                    'listing': listing,
                    'watched': watched,
                    'BiddingForm': form,
                    'bidcount': bidcount,
                    'highestbidder': highestbidder,
                    'CommentForm': CommentForm(),
                    'comments': comments
                })
            
            # Validate that the new bid is higher than the current price
            if not bid.price > listing.highest_bid:
                form.add_error('price', f'Your bid needs to be higher than {listing.highest_bid}')
                return render(request, 'auctions/details.html', {
                    'listing': listing,
                    'watched': watched,
                    'BiddingForm': form,
                    'bidcount': bidcount,
                    'highestbidder': highestbidder,
                    'CommentForm': CommentForm(),
                    'comments': comments
                })
            
            # Save the valid bid and update the listing's current highest price
            bid.save()
            listing.highest_bid = bid.price
            listing.save()
            return redirect('detailview', listing.id)
            
            
        else:
            return render(request, 'auctions/details.html', {
            'listing': listing,
            'watched': watched,
            'BiddingForm': form,
            'bidcount': bidcount,
            'highestbidder': highestbidder,
            'CommentForm': CommentForm(),
            'comments': comments
            })
        
        
    else:
        return render(request, 'auctions/details.html', {
            'listing': listing,
            'watched': watched,
            'BiddingForm': BiddingForm(),
            'bidcount': bidcount,
            'highestbidder': highestbidder,
            'CommentForm': CommentForm(),
            'comments': comments
            })

@login_required
def watch(request):
    """Manages the user's watchlist (adding/removing items or viewing the list)."""
    if request.method == 'POST':
        listing = Listing.objects.get(id=request.POST['id'])
        user = request.user

        if request.POST['action'] == 'delete':
            listing.watchers.remove(user)
            return redirect('detailview', listing.id)
        else:
            listing.watchers.add(user)
            return redirect('detailview', listing.id)
    else:
        user = request.user
        watched_listings = user.watched.all()
        return render(request, 'auctions/watchlist.html', {
            'watched_listings': watched_listings,
        })
    
def categories(request, category):
    """Displays listings filtered by a specific category (or all categories if none selected)."""
    categories = Category.objects.all().order_by('name')
    try:
        cat = Category.objects.get(name=category) 
        listings = cat.listings.filter(state=True).all()
    except Exception:
        return render(request, "auctions/categories.html", {
        'category': category,
        'categories': categories,
        })
    return render(request, "auctions/categories.html", {
        'category': category,
        'categories': categories,
        'listings': listings
    })

def close(request):
    """Allows the seller to close an auction, marking it as inactive and finalizing the winner."""
    if request.method == "POST":
        listing = Listing.objects.get(id=request.POST['id'])
        if request.user == listing.seller:
            listing.state = False
            listing.save()
            return redirect('detailview', listing.id)
    else:
        return redirect('index')
    
def comment(request):
    """Allows authenticated users to post comments on an auction listing."""
    if request.method =='POST':
        listing = Listing.objects.get(id=request.POST['id'])
        form = CommentForm(request.POST)
        if form.is_valid:
            comment = form.save(commit=False)
            comment.listing = listing
            comment.user = request.user
            comment.save()
            return redirect('detailview', listing.id)


        else:
            return redirect('detailview', listing.id)
    else:
        return redirect('detailview', listing.id)