$(document).ready(function() {
$('#input_1704').bind("enterKey",function(e){
   doSearch();
});
$('#input_1704').keyup(function(e){
    if(e.keyCode == 13)
    {
        $(this).trigger("enterKey");
    }
});
});

function doSearch(ee) {
    if (!ee) {
        var x = $('#input_1704').val();
    } else {
        var x = ee;
    }


    if (!x) {
        $('#searchres').text('Invalid search string');
        $('#searchres').show();
    } else {
        $('#searchres').text('Searching for ' + x + '...');
        $('#searchres').show();
        window.location.href = 'search.html#' + x;
        if (!window.location.hash) {
            // window.location.href = window.location.href;
        } else {
            window.location.reload();
        }
    }
}