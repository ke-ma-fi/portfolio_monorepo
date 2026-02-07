from django.shortcuts import render, redirect
from django.urls import reverse

import markdown2 as md
import random

from . import util

def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })


def wiki(request, title):

    content = util.get_entry(title)
    if not content:
        return render(request, "encyclopedia/error.html")
    

    return render(request, "encyclopedia/content.html", {
    "content": md.markdown(content)
    })

    
def search(request):
    q = request.GET.get('q').lower()

    if not q: 
        return redirect('index')
    
    all_entries = util.list_entries()
    all_entries_lower = [item.lower() for item in all_entries]
    matches = []

    if not q in all_entries_lower:
        for entry in all_entries:
            if q in entry.lower():
                matches.append(entry)
        if not matches:
            return render(request, "encyclopedia/error.html")
        return render(request, "encyclopedia/results.html", {
            "matches": matches
        })

    return redirect('wiki', title=q)

def add_page(request):
    if request.method == "POST":
        title = request.POST.get('title')
        content = request.POST.get('content')
        all_entries = util.list_entries()
        all_entries_lower = [item.lower() for item in all_entries]

        if not title or not content:
            return redirect(f"{reverse('add')}?message=Provide+Title+and+Content&title={title}&content={content}")
        
        if title.lower() in all_entries_lower:
            return redirect(f"{reverse('add')}?message=Title+already+exists&title={title}&content={content}")
        
        content = f"#{title}\n\n" + content
        util.save_entry(title, content)

        return redirect('wiki', title=title)
     
    if request.method == "GET":
        message = request.GET.get("message")
        title = request.GET.get("title")
        content = request.GET.get("content")
        if not message:
            message = ""
        if not title:
            title = ""
        if not content:
            content = ""

        return render(request, "encyclopedia/add.html", {
            "message": message,
            "title": title,
            "content": content
        })
    
def edit_page(request, title, operation):
    if request.method == "POST":
        content = request.POST.get('content')
        all_entries = util.list_entries()
        all_entries_lower = [item.lower() for item in all_entries]

        if not title or not content:
            return redirect(f"{reverse('edit', kwargs={'title': title, 'operation': 'edit'})}?message=Something+went+wrong.+Please+provide+content.&content={content}")
        
        if not title.lower() in all_entries_lower:
            return redirect(f"{reverse('edit', kwargs={'title': title, 'operation': 'edit'})}?message=Something+went+wrong.&content={content}")
        

        util.save_entry(title, content)
        return redirect('wiki', title=title)
    
    if request.method == "GET":

        if operation == "edit":
            content = util.get_entry(title)
            message = request.GET.get('message')

            if not message:
                message = ""

            if not title or not content:
                redirect('index') 
            
            return render(request, "encyclopedia/edit.html", {
                "message": message,
                "title": title,
                "content": content
            } )
        
        if operation == "delete":
            util.delete_entry(title)

        return redirect('index')
    
    
def random_page(request):
        all_entries = util.list_entries()
        number = random.randint(0, len(all_entries)-1)
        title = all_entries[number]
        return redirect('wiki', title=title)