function refreshRich() {
    // fake call to prevent errors on Chrome
     $.ajax({
         url: 'http://104.251.219.215:8080/api/',
               // crossDomain: true,
     // dataType: 'json',
                 type: "GET",
     });
    $.ajax({
        url: 'http://104.251.219.215:8080/api/richlist',
        success: function(data, textStatus, jqXHR) {
            $('#richA1').text(data.richlist[1].balance);
            $('#richB1').text(data.richlist[1].address);
            $('#richB1').attr('href','search.html#' + data.richlist[1].address);
            $('#richA2').text(data.richlist[2].balance);
            $('#richB2').text(data.richlist[2].address);
            $('#richB2').attr('href','search.html#' + data.richlist[2].address);
            $('#richA3').text(data.richlist[3].balance);
            $('#richB3').text(data.richlist[3].address);
            $('#richB3').attr('href','search.html#' + data.richlist[3].address);
            $('#richA4').text(data.richlist[4].balance);
            $('#richB4').text(data.richlist[4].address);
            $('#richB4').attr('href','search.html#' + data.richlist[4].address);
            $('#richA5').text(data.richlist[5].balance);
            $('#richB5').text(data.richlist[5].address);
            $('#richB5').attr('href','search.html#' + data.richlist[5].address);
            $('.dimmer').hide();
        }
    });
}


$(document).ready(function() {
         refreshRich();
         });

window.setInterval(function() {
    refreshRich();
}, 20000);