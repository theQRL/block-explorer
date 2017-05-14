




function refreshData() {
   // fake call to prevent errors on Chrome
    $.ajax({
        url: 'http://104.251.219.215:8080/api/',
              // crossDomain: true,
    // dataType: 'json',
                type: "GET",
    });
    $.ajax({
        url: 'http://104.251.219.215:8080/api/stakers',
              // crossDomain: true,
    // dataType: 'json',
                type: "GET",
        success: function(data, textStatus, jqXHR) {
            $('.dimmer').hide();
            drawStakers(data);
        }
    });

}


function drawStakers(data) {
    var Stakers = $('#Stakers').DataTable();
    Stakers.clear();
    _.each(data.stake_list, function(object) {
        drawStakersRow(object.nonce, object.balance, object.address, object.hash_terminator);
    });
}


function drawStakersRow(a, b, c, d) {



var Stakers = $('#Stakers').DataTable();

    Stakers.row.add([c,b,a,d]).draw(true);


}




$(document).ready(function() {

    $('#Stakers').DataTable({
        select: true,
        paging: false,
        info: false,
        searching: false,
        lengthChange: false,
        "order": [[ 0, 'dec' ], [ 3, 'dec' ]],
        "columnDefs": [
        { "orderable": false, "targets": 0 },
        { "orderable": false, "targets": 1 },
        { "orderable": false, "targets": 2 },
        { "orderable": false, "targets": 3 },
                    // {
                    //     "targets": [ 4 ],
                    //     "visible": false,
                    //     "searchable": false
                    // },
                ],
            rowReorder: {
        enable: false
    }      
    });

    $('.table')
        .on( 'click', function ( e ) {
            var table = $(this).DataTable();
            console.log('row = ' + e.target._DT_CellIndex.row);
            console.log('col = ' + e.target._DT_CellIndex.column);
            var rowData = table.rows( e.target._DT_CellIndex.row ).data();

            doSearch(rowData[0][0]);

        } );
         refreshData();

});



window.setInterval(function() {
    refreshData();
}, 100000);

