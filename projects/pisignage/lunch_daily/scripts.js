const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const today = new Date().toLocaleDateString('de-DE', { weekday: 'long' });

let img = document.getElementById('bg');
let bg_options = ["Mittagstisch1.png", "Mittagstisch2.png"];
let randomIndex = Math.floor (Math.random () * bg_options.length);
let bg_image = bg_options[randomIndex];
img.style.backgroundImage = "url('" + bg_image + "')";

$(function() {
    $.getJSON('Menuplan.json', function(data) {
        var cur_date = new Date().toISOString().slice(0,10);

      $.each(data, function(i, item) {
        if (item.Preis == 0.0){
          item.Preis = null;
        }
      });
        
      $.each(data, function(i, item) {
        var div = $('#content');
        if (cur_date == item.Datum){
            if (item.Gericht != null){
              div.append('<h1>' + item.Gericht + '</h1>');
            }
            if (item.Preis != null){
              div.append('<h1 class="price">' + formatter.format(item.Preis) + '</h1>');
            }
            
        }
      });
    });
  });

var div = $('#weekday');
div.append('<h2>' + today.toLocaleUpperCase() + '</h2>');