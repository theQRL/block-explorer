
$(document).ready(function() {
    $('.tabular.menu .item').tab();
    $('#Saddress').hide();
    $('#Shash').hide();
    var s = window.location.href;
    s = s.split('#')[1];
   
   if(s){

   // TEST HERE!
    // var s = 'Q60470c8d6f57968e604753065ff700b506776d97113b00a7afcc347aa11bdbed8471';
   // var s = 'db8d879007b8472c2175b47be1d6446a97b1f4ad9b0746ce9eb4f3e2df980e59';
  // var s = 0;


   if (isInt(s)) {console.log('likely a block number'); }

   if (s.length == 64) {
    console.log('search string is likely a txhash');
    $('#searchID').html('<small>TXHASH</small><br>' + s);
    $.ajax({

        url: 'http://104.251.219.215:8080/api/txhash/' + s,
        success: function(data, textStatus, jqXHR) {
            console.log(data);
            $('#PartiesTo').text(data.txto);
            $('#PartiesTo').click(function(){
                doSearch($(this).text());
            })
            $('#PartiesFrom').text(data.txfrom);
          $('#PartiesFrom').click(function(){
              doSearch($(this).text());
          })  
          $('#Txblock').text(data.block);
          $('#Txamount').text(data.amount);
          $('#Txfee').text(data.fee);
          $('#Txtype').text(data.type);
          var x = moment.unix(data.timestamp);
          $('#Txtime').text(moment(x).format("HH:mm D MMM YYYY"));
          $('#PK').html('PK:<blockquote>' + data.PK[0] + '<br>' + data.PK[1] + '</blockquote>');
            const myJSON = data.pub;
            const formatter = new JSONFormatter(myJSON);
            $('#PK').append(formatter.render());
            $('.json-formatter-constructor-name').first().text('Pub');
            $('.loader').hide();
            $('.dimmer').hide();
            $('#Shash').show();
        }
    });
    }

   // begins with Q and 69 bytes long - likely an address
   if (s.length == 69 && s.charAt(0) == 'Q') {
    $('#searchID').html('<small>Address</small><br>' + s);
    var qrcode = new QRCode(document.getElementById("qrcode"), {
        text: s,
        width: 100,
        height: 100,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
    console.log('search string is likely an address');
    // ADDRESS display
    $.ajax({
        url: 'http://104.251.219.215:8080/api/address/' + s,
        success: function(data, textStatus, jqXHR) {
            $('.loader').hide();
            $('.dimmer').hide();
            $('#Saddress').show();
            $('#TransT').show();
            $('#balance').text(data.state.balance);
            $('#nonce').text(data.state.nonce);
            $('#transactions').text(data.state.transactions);
            var row = $("<tr />");
            $("#TransT-table").empty(row);
            _.each(data.transactions, function(object) {
                drawTransRow(object.timestamp, object.amount, object.txhash, object.block, object.txfrom, object.txto, object.fee, s);
            });
        }
    });
}






}


});


function drawTransRow(a,b,c,d,e,f,g,h) {
    var row = $("<tr />");
    $("#TransT-table").append(row);
    var x = moment.unix(a);
    row.append($("<td onclick=\"doSearch('" + c + "')\">" + c.substring(0,16) + "...</td>"));
    row.append($("<td>" + d + "</td>"));
    row.append($("<td>" + moment(x).format("HH:mm D MMM YYYY") + "</td>"));
        row.append($("<td onclick=\"doSearch('" + e + "')\">" + e.substring(0,16) + "...</td>"));


    if (h == e) {
        row.append($('<td class=\"center aligned\">Sent <i class=\"sign out icon\"></i></td>'));
     } else { 
        row.append($('<td class=\"center aligned\"><i class=\"sign in icon\"></i> Received</td>'));
     }
    row.append($("<td onclick=\"doSearch('" + f + "')\">" + f.substring(0,16) + "...</td>"));
    row.append($("<td>" + b + "</td>"));
    row.append($("<td>" + g + "</td>"));
}

function isInt(value) {
  var x = parseFloat(value);
  return !isNaN(value) && (x | 0) === x;
}