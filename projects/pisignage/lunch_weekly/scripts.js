const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});


function getWeek(date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0); // Set time to midnight
  targetDate.setDate(targetDate.getDate() + 4 - (targetDate.getDay() || 7)); // Adjust to Thursday (ISO week starts on Monday)
  const yearStart = new Date(targetDate.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((targetDate - yearStart) / 86400000 + 1) / 7); // 86400000 = milliseconds in a day
  return weekNumber;
}



function getWeekday(date) {
  const weekdays = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."];
  const dayIndex = date.getDay();

  return weekdays[dayIndex];
}

$(function() {
    $.getJSON('Menuplan.json', function(data) {
        var cur_date = new Date().toISOString().slice(0,10);
        var alternate = 0;
      $.each(data, function(i, item) {
        if (item.Gericht == null){
          item.Gericht = "";
        }
      });
      $.each(data, function(i, item) {
        if (alternate == 0 && getWeek(cur_date) == getWeek(new Date(item.Datum))){
          var divDay = $('#day'); 
          divDay.append('<h1 class="weekday">' + getWeekday(new Date(item.Datum)) + '</h1><br>');
          var div = $('#lunch1');
          if (item.Gericht.startsWith('Schnitzeltag')){
            div.append('<div class="gericht" id="stGericht"><h1>' + item.Gericht + '</h1></div>');
            div = $('#price2');
            div.append('<h1 class="'+ (item.Preis == 0.0 ? "price-empty" : "price") + '">' + (item.Preis != null ? formatter.format(item.Preis) : "") + '</h1>');
            div = $('#price1');
            div.append('<h1 class="price"></h1><br><br><br><br>');
            alternate = 1;
          }
          else {
            div.append('<div class="gericht"><h1>' + item.Gericht + '</h1></div>');
            div = $('#price1');
            div.append('<h1 class="'+ (item.Preis == 0.0 ? "price-empty" : "price") + '">' + (item.Preis != null ? formatter.format(item.Preis) : "") + '</h1><br>');
            alternate = 1;
          }
        }
        else if (getWeek(cur_date) == getWeek(new Date(item.Datum))){
          var div = $('#lunch2');
          div.append('<div class="gericht"><h1>' + item.Gericht + '</h1></div>');
          div = $('#price2');
          div.append('<h1 class="'+ (item.Preis == 0.0 ? "price-empty" : "price") + '">' + (item.Preis != null ? formatter.format(item.Preis) : "") + '</h1><br>');
          alternate = 0;
        }
      });
    });
  });

