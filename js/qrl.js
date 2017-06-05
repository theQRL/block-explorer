




function refreshData() {
   // fake call to prevent errors on Chrome
    $.ajax({
        url: 'http://104.251.219.215:8080/api/',
              // crossDomain: true,
    // dataType: 'json',
                type: "GET",
    });
    $.ajax({
        url: 'http://104.251.219.215:8080/api/stats',
              // crossDomain: true,
    // dataType: 'json',
                type: "GET",
        success: function(data, textStatus, jqXHR) {
            $('.dimmer').hide();
            drawStats(data);
        }
    });
    $.ajax({
        url: 'http://104.251.219.215:8080/api/last_tx/5',
    //      crossDomain: true,
    // dataType: 'json',
        type: "GET",
        success: function(data, textStatus, jqXHR) {
            $('.dimmer').hide();
            drawTxTable(data);
        }
    });
    $.ajax({
        url: 'http://104.251.219.215:8080/api/last_block/5',
    //             crossDomain: true,
    // dataType: 'json',
                type: "GET",
        success: function(data, textStatus, jqXHR) {
            $('.dimmer').hide();
            drawBlockTable(data);
        }
    });

}

function drawStats(data){
    $('#network').text(':' + data.network);
    var x = moment.duration(data.network_uptime,'seconds').format("d[d] h[h] mm[min]");
    $('#uptime').text(x);
    $('#nodes').text(data.nodes);
    var x = moment.duration(data.block_time_variance,'seconds');
    x = Math.round(x/10)/100;
    $('#variance').text(x + 's');
    var x = moment.duration(data.block_time,'seconds').format("s[s]");
    $('#blocktime').text(x);
    $('#blockheight').text(data.blockheight);
    $('#validators').text(data.stake_validators);
    $('#PCemission').text(data.staked_percentage_emission + '%');
    $('#epoch').text(data.epoch);
    var x = data.emission;
    x = (Math.round(x * 10000)) / 10000;
    $('#emission').text(x);
    var x = data.unmined;
    x = (Math.round(x * 10000)) / 10000;
    $('#unmined').text(x);
    $('#reward').text(data.block_reward);

}

function drawTxTable(data) {
    var TxT = $('#TxT').DataTable();
    TxT.clear();
    _.each(data.transactions, function(object) {
        drawTxRow(object.timestamp, object.amount, object.txhash, object.block);
    });
}

function drawBlockTable(data) {
   var BlT = $('#BlT').DataTable();
   BlT.clear();
    _.each(data.blocks, function(object) {
        drawBlockRow(object.timestamp, object.number_transactions, object.blockhash, object.blocknumber);
    });
}

function drawTxRow(a, b, c, d) {
   // var row = $("<tr />");
    //$("#tx-table").append(row);
    var x = moment.unix(a);
    // console.log(x.fromNow());
  //  if (x.isValid()) {
// "x epoch ago" instead of this:
//row.append($("<td>" + moment(x).format("HH:mm D MMM YYYY") + "</td>"));
   // row.append($("<td>" + x.fromNow() + "</td>"));
// } else {
    // row.append($("<td>unconfirmed</td>"));
// }
    // row.append($("<td>" + b + "</td>"));
    // row.append($("<td onclick=\"doSearch('" + c + "')\">" + c + "</td>"));
    // row.append($("<td onclick=\"doSearch('" + d + "')\">" + d + "</td>"));

var TxT = $('#TxT').DataTable();
if (x.isValid()) {
    TxT.row.add([x.fromNow(),b,c,d,a]).draw(true);
} else {
    TxT.row.add(['unconfirmed',b,c,d,a]).draw(true);
}

}

function drawBlockRow(a, b, c, d) {
    // var row = $("<tr />");
    // $("#block-table").append(row);
    var x = moment.unix(a/1000);
    console.log(x);
    // row.append($("<td>" + moment(x).format("HH:mm D MMM YYYY") + "</td>"));
    // row.append($("<td>" + b + "</td>"));
    // row.append($("<td onclick=\"doSearch('" + c + "')\">" + c + "</td>"));
    // row.append($("<td onclick=\"doSearch('" + d + "')\">" + d + "</td>"));
var BlT = $('#BlT').DataTable();
// "[epoch]" ago instead of this...
//BlT.row.add([moment(x).format("HH:mm D MMM YYYY"),b,c,d]).draw( true );
BlT.row.add([x.fromNow(),b,c,d,a]).draw(true);
}

// function toArray(obj) {
//     const result = [];
//     for (const prop in obj) {
//         const value = obj[prop];
//         if (typeof value === 'object') {
//             result.push(toArray(value)); // <- recursive call
//         } else {
//             result.push(value);
//         }
//     }
//     return result;
// }


$(document).ready(function() {
      $('.tabular.menu .item').tab();

    
    $('#BlT').DataTable({
        select: true,
        paging: false,
        info: false,
        searching: false,
        lengthChange: false,
        "order": [[ 4, 'dec' ], [ 3, 'dec' ]],
        "columnDefs": [
                    { "orderable": false, "targets": 0 },
                    { "orderable": false, "targets": 1 },
                    { "orderable": false, "targets": 2 },
                    { "orderable": false, "targets": 3 },
                    {
                        "targets": [ 4 ],
                        "visible": false,
                        "searchable": false
                    },
                ],
            rowReorder: {
        enable: false
    } 
    });
    $('#TxT').DataTable({
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
                    {
                        "targets": [ 4 ],
                        "visible": false,
                        "searchable": false
                    },
                ],
            rowReorder: {
        enable: false
    }      
    });


   // $('.table').on('mouseenter','tr', function(){
   //           console.log($(this).text());

   //       });
   // $('#BlT table td')
   //   .popup({
   //     popup : $('.custom.popup'),
   //     hoverable: true
   //   });

   $('.table')
       .on( 'click', function ( e ) {
           var table = $(this).DataTable();
           // console.log('row = ' + e.target._DT_CellIndex.row);
           // console.log('col = ' + e.target._DT_CellIndex.column);
           var rowData = table.rows( e.target._DT_CellIndex.row ).data();
           if (e.currentTarget.id == 'BlT') {
            $('#domModalTitle').text('Blockhash clicked');
            $('#domModalBody').text('Blockhash: '+rowData[0][2]);
            window.location.href = 'search.html#'+rowData[0][3];
            // $('#domModal').modal('show');
           } else {
           doSearch(rowData[0][2]);
       }
       } );


         refreshData();

});



window.setInterval(function() {
    refreshData();
}, 5000);

