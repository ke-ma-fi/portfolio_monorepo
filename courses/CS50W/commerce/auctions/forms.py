from django import forms
from .models import Listing, Bid, Comment

class ListingForm(forms.ModelForm):
    class Meta:
        model = Listing
        fields = '__all__'
        exclude = ['state', 'seller', 'watchers', 'highest_bid']
    newCategory = forms.CharField(max_length=90, required=False, label='Add Category', help_text='Category not found? Add some of your own!')


class BiddingForm(forms.ModelForm):
    class Meta:
        model = Bid
        fields = ['price']
        

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['comment']