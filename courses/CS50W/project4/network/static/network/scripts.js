document.addEventListener('DOMContentLoaded', function () {
    
    load_posts('all');
});

function load_posts(action, page, user_id) {
    if(action == 'user') {
        document.querySelector('#display-user').innerHTML = '';
        document.querySelector('#display-user').style.display = 'block';
        load_user(user_id);
    }
    else {
        document.querySelector('#display-user').style.display = 'none';
        document.querySelector('#display-user').innerHTML = '';
        document.querySelector('#post-kind').innerHTML = `${action} Posts`;
    }

    page = page || 1;
    const display = document.querySelector('#post-area');
    display.innerHTML = "";
    
    fetch(`/${action}?page=${page}&id=${user_id ? user_id : ''}`)
    .then(response => response.json())
    .then(data => {
        const posts = data.posts;
        const pagination = data.pagination;

        //display posts
        posts.forEach(post => {
            const div = document.createElement('div');
            div.id = `post${post.id}`;
            div.classList.add('posts');
            div.innerHTML = `
            <a href="#" onclick="load_posts('user', 1, ${post.user_id})"><div class="user">${post.user}</div></a>
            <div class="content" id="content${post.id}">${post.content}</div>
            <div class="created">${post.created}</div>
            <button id="likeb${post.id}" onclick="like(${+post.id})"><i class="bi bi-suit-heart-fill"></i></button> 
            <span class="likec" id="likec${post.id}"> ${post.likes_count} </span>`
            if (post.owned) {
                div.innerHTML += `<button class="but_ed" id="edit${post.id}"onclick="edit_post(${post.id})"><i class="bi bi-pencil-square"></i></button>`;
            } 

            display.append(div);

            if (post.liked == true) {
                document.querySelector(`#likeb${post.id}`).style.color = 'red';
            }

        });

        //manage pagination
        const pag_nav = document.querySelector('#pagination1');
        pag_nav.innerHTML = "";
        const prev = document.createElement('li');
        prev.innerHTML = `<a class="page-link" href="#" onclick="load_posts('${action}', ${pagination.current_page-1}, ${user_id})">Previous</a>`;
        pag_nav.append(prev);
        for (i=1; i < pagination.total_pages + 1 ; i++) {
            const li = document.createElement('li');
            li.classList.add('page-item');
            li.innerHTML = `<a class="page-link" href="#" onclick="load_posts('${action}', ${i}, ${user_id})" 
            ${i == pagination.current_page ? 'style="color: red"' : ''} >${i}</a>`;
            pag_nav.append(li);
        }
        const next = document.createElement('li');
        next.innerHTML = `<a class="page-link" href="#" onclick="load_posts('${action}', ${pagination.current_page == pagination.total_pages ? pagination.current_page : pagination.current_page+1}, ${user_id})">Previous</a>`;
        pag_nav.append(next);
    });
}

function like(post_id) {

    fetch(`like/${post_id}`)
    .then(response => response.json())
    .then(() => {
        fetch(`${post_id}`)
        .then(response => response.json())
        .then(post => {
            document.querySelector(`#likec${post_id}`).innerHTML = `${post.likes_count}`

            if (post.liked == true) {
                document.querySelector(`#likeb${post.id}`).style.color = 'red';
            }
            else {
                document.querySelector(`#likeb${post.id}`).style.color = 'black';
            }
        })
    })
}

function edit_post(post_id) {
    document.querySelector(`#edit${post_id}`).style.display = 'none';
    const content_div = document.querySelector(`#content${post_id}`);
    const post_div = document.querySelector(`#post${post_id}`);
    const txt = document.createElement('textarea');
    const submit = document.createElement('button');
    submit.innerHTML = 'Submit';
    txt.value = content_div.innerHTML;
    content_div.style.display = 'none';
    post_div.append(txt);
    post_div.append(submit);
    submit.addEventListener('click', () => {
        fetch(`/${post_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: `${txt.value}`
            })
        })
        .then(response => response.json())
        .then( post => {
            document.querySelector(`#edit${post_id}`).style.display = 'inline';
            txt.remove();
            submit.remove();
            content_div.innerHTML = post.content;
            content_div.style.display = 'block';
            
        })
    });
}

function load_user (other_user) {
    document.querySelector('#display-user').innerHTML = '';
    fetch(`user/${other_user}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(user => {
        document.querySelector('#post-kind').innerHTML = `${user.username}'s Posts`;
        const display = document.querySelector('#display-user');
        const name = document.createElement('h2');
        const fers = document.createElement('div');
        const fings = document.createElement('div');
        const button = document.createElement('div');
        name.innerHTML = `${user.username}'s Profile`;
        fers.innerHTML = `Followers: ${user.followers_count}`;
        fings.innerHTML = `Following: ${user.following_count}`;
        if (user.followed) {
            button.innerHTML = `<button onclick="follow('DELETE', ${other_user})"> Unfollow </button>`;
        }
        else if (!user.authenticated) {
            button.innerHTML = '';
        }
        else if (user.self) {
            button.innerHTML = '';
        }
        else {
            button.innerHTML = `<button onclick="follow('PUT', ${other_user})"> Follow </button>`;  
        }
        
        display.append(name, fers, fings, button);
    })
}

function follow (action, other_user) {

    fetch(`user/${other_user}`, {
        method: action,
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(() => {
        load_user(other_user);
    })
}