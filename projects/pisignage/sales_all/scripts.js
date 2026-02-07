const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});


function formatDate(inputDate) {
  if (inputDate == null){
    return null;
  }
  const dateParts = inputDate.split('-');
  if (dateParts.length !== 3) {
      return null; 
  }
  const [year, month, day] = dateParts;
  return `${day}.${month}.${year}`; 
}


$(function() {
    $.getJSON('Sales.json', function(data) {
      $.each(data, function(i, item) {
        var div = $('#end')
        if (formatDate(item.Ende) != null){
          div.append('<h1>' + formatDate(item.Ende) + '</h1>')
        }
        if (['G', 'N', 'H'].includes(item.Art)){
          div = $('#main')
          div.append('<h2>' + item.Artikel + '</h2>')
          if (item.Suff != null && item.Suff != 0){
            div = $('#suff')
            div.append('<h4>' + item.Suff + '</h4>')
          } 
          div = $('#price')
          div.append('<h3>' + formatter.format(item.Preis) + '/' + item.Einheit + '</h3>')
        }
        
      });
    });
  });
