let nav_array = document.querySelectorAll(".nav-link")

for (let i = 0; i < nav_array.length; i++)
{
    nav_array[i].addEventListener('mouseover', function(){
        nav_array[i].style.color = "#c9c9c9";
        nav_array[i].style.textDecoration = "underline";
    })

    nav_array[i].addEventListener('mouseout', function(){
        nav_array[i].style.textDecoration = "";
        nav_array[i].style.color = "";
    })
}

function check_age() {
    let age = document.getElementById("I1").value
    if (age == 4) {
        document.getElementById("I1").style.backgroundColor = "green";
        document.getElementById("A1").innerHTML = "Correct! Here is my special picture! It's my friend Jay and me!";
        document.getElementById("special").setAttribute("src", "https://images.pexels.com/photos/4783419/pexels-photo-4783419.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1");
        document.getElementById("special").style.visibility = "visible";
    }
    else if ( age < 4) {
        document.getElementById("I1").style.backgroundColor = "red";
        document.getElementById("A1").innerHTML = "Thats wrong, Wuff! Try again, I am older than that!";
    }
    else {
        document.getElementById("I1").style.backgroundColor = "red";
        document.getElementById("A1").innerHTML = "Thats wrong, Wuff! Try again, I am younger than that!";
    }
}
