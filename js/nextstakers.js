




function refreshData() {
   // fake call to prevent errors on Chrome
    $.ajax({
        url: 'http://104.251.219.215:8080/api/',
              // crossDomain: true,
    // dataType: 'json',
                type: "GET",
    });
    $.ajax({
        url: 'http://104.251.219.215:8080/api/next_stakers',
              // crossDomain: true,
    // dataType: 'json',
                type: "GET",
        success: function(data, textStatus, jqXHR) {
            $('.dimmer').hide();
            drawNextStakers(data);
        }
    });

}


function drawNextStakers(data) {
    var NextStakers = $('#NextStakers').DataTable();
    NextStakers.clear();
    _.each(data.stake_list, function(object) {
        drawNextStakersRow(object.nonce, object.balance, object.address, object.hash_terminator);
    });
}


function drawNextStakersRow(a, b, c, d) {



var NextStakers = $('#NextStakers').DataTable();

    NextStakers.row.add([c,b,a,d]).draw(true);


}




$(document).ready(function() {

    $('#NextStakers').DataTable({
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

