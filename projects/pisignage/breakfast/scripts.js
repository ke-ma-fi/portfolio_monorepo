const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

$(function() {
    $.getJSON('Sales.json', function(data) {
      $.each(data, function(i, item) {
        if (item.Art == 'F'){
          var div = $('#content');
          div.append('<h1>' + item.Artikel + '</h1>');
          if (item.Suff != null && item.Suff != 0){
            div.append('<h2 calss="suff">' + item.Suff + '</h2>')
          }
          div.append('<h2 class="price"> jetzt nur ' + formatter.format(item.Preis) + '/' + item.Einheit + '</h2>');
        }
      });
    });
  });
