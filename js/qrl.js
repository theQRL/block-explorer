
$(document).ready(function() {
    
    var BlT = $('#BlT').DataTable({
        paging: false,
        info: false,
        searching: false,
        lengthChange: false,
        "order": [[ 0, 'dec' ], [ 1, 'dec' ]]
    });
    refreshData();
} );

window.setInterval(function() {
    refreshData();
}, 5000);

function refreshData() {
    $.ajax({
        url: 'http://104.251.219.215:8080/api/last_tx/5',
        success: function(data, textStatus, jqXHR) {
            drawTxTable(data);
        }
    });
    $.ajax({
        url: 'http://104.251.219.215:8080/api/last_block/5',
        success: function(data, textStatus, jqXHR) {
            drawBlockTable(data);
        }
    });
    $.ajax({
        url: 'http://104.251.219.215:8080/api/stats',
        success: function(data, textStatus, jqXHR) {
            drawStats(data);
        }
    });
}

function drawStats(data){
    $('#network').text(data.network);
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
    var row = $("<tr />");
    $("#tx-table").empty(row);
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
    var row = $("<tr />");
    $("#tx-table").append(row);
    var x = moment.unix(a);
    if (x.isValid()) {
    row.append($("<td>" + moment(x).format("HH:mm D MMM YYYY") + "</td>"));
} else {
    row.append($("<td>unconfirmed</td>"));
}
    row.append($("<td>" + b + "</td>"));
    row.append($("<td onclick=\"doSearch('" + c + "')\">" + c + "</td>"));
    row.append($("<td onclick=\"doSearch('" + d + "')\">" + d + "</td>"));
}

function drawBlockRow(a, b, c, d) {
    // var row = $("<tr />");
    // $("#block-table").append(row);
    var x = moment.unix(a);
    // row.append($("<td>" + moment(x).format("HH:mm D MMM YYYY") + "</td>"));
    // row.append($("<td>" + b + "</td>"));
    // row.append($("<td onclick=\"doSearch('" + c + "')\">" + c + "</td>"));
    // row.append($("<td onclick=\"doSearch('" + d + "')\">" + d + "</td>"));
var BlT = $('#BlT').DataTable();
BlT.row.add([moment(x).format("HH:mm D MMM YYYY"),b,c,d]).draw( true );
}

function toArray(obj) {
    const result = [];
    for (const prop in obj) {
        const value = obj[prop];
        if (typeof value === 'object') {
            result.push(toArray(value)); // <- recursive call
        } else {
            result.push(value);
        }
    }
    return result;
}


