function rd() {

   var s = window.location.href;
   s = s.split('#')[1];
  
  if(s){

       // begins with Q and 69 bytes long - likely an address
       if (s.length == 69 && s.charAt(0) == 'Q') {
        $('#searchID').html('<small>Address</small><br>' + s);
        // ADDRESS display
        $.ajax({
            url: 'http://104.251.219.215:8080/api/address/' + s,
            success: function(data, textStatus, jqXHR) {

                $('#balance').text(data.state.balance);
                $('#nonce').text(data.state.nonce);
                $('#transactions').text(data.state.transactions);
                // var row = $("<tr />");
                // $("#TransT-table").empty(row);
                // _.sortBy(data.transactions, 'block');
                var x = $( window ).width();
                var y = 1
                if (x>640) {y = 2}
                if (x>660) {y = 3}
                if (x>680) {y = 4}
                if (x>700) {y = 5}
                if (x>720) {y = 6}
                if (x>740) {y = 7}
                if (x>760) {y = 8}
                if (x>780) {y = 9}
                if (x>800) {y = 10}
                if (x>820) {y = 11}
                if (x>840) {y = 12}
                if (x>860) {y=12}
                if (x>880) {y=12}
                if (x>900) {y=12}
                if (x>920) {y=12}
                if (x>940) {y=14}
                if (x>1040) {y=20}
                if (x>1180) {y=32}
                if (x>1300) {y=36}
                if (x>1420) {y=40}
                  if (x>1520) {y=48}
                    if (x>1620) {y=52}
                      if (x>1720) {y=56}
                        if (x>1820) {y=60}
                if (x>1920){y = 0} 
                    var TransT = $("#TransT").DataTable();
                  TransT.clear();
                _.each(data.transactions, function(object) {
                    drawTransRow(y,object.timestamp, object.amount, object.txhash, object.block, object.txfrom, object.txto, object.fee, s);
                });
                
                TransT.columns.adjust().draw(true);
                $("#TransT").width("100%");
            }
        });
    }
 
}
}


$(document).ready(function() {
  $("#TransT").DataTable({
      select: true,
      paging: false,
      info: false,
      searching: false,
      lengthChange: false,
      autoWidth: false,
      responsive: true,
      // "sScrollX": "100%",
      // "sWidth": "100%",
      // scrollX: true,
      "order": [[ 1, 'dec' ], [ 3, 'dec' ]],
      "columnDefs": [
                  { "orderable": false, "targets": 0},
                  { "orderable": false, "targets": 1 },
                  { "orderable": false, "targets": 2 },
                  { "orderable": false, "targets": 3 },
                  { "orderable": false, "targets": 4 },
                  { "orderable": false, "targets": 5 },
                  { "orderable": false, "targets": 6 },
                  {
                      "targets": [ 7 ],
                      "visible": true,
                      "searchable": false,
                      "width": 0
                  },
                  {
                      "targets": [ 8 ],
                      "visible": false,
                      "searchable": false,
                      "width": 0
                  },
                  {
                      "targets": [ 9 ],
                      "visible": false,
                      "searchable": false,
                      "width": 0
                  },
                  {
                      "targets": [ 10 ],
                      "visible": false,
                      "searchable": false,
                      "width": 0
                  },
              ],
          rowReorder: {
      enable: false
  } 
  });


    // $('.tabular.menu .item').tab();
    $('#Saddress').hide();
    $('#Shash').hide();
    var s = window.location.href;
    s = s.split('#')[1];
   console.log(s);
   if(s){

   // TEST HERE!
    // var s = 'Q60470c8d6f57968e604753065ff700b506776d97113b00a7afcc347aa11bdbed8471';
   // var s = 'db8d879007b8472c2175b47be1d6446a97b1f4ad9b0746ce9eb4f3e2df980e59';
  // var s = 0;


   if (isInt(s)) {
    console.log('likely a block number'); 
    window.location = 'http://104.251.219.215:8080/api/block_data/' + s;
 }

   if (s.length == 64) {
    console.log('search string is likely a txhash');
    $('#searchID').html('<small>TXHASH</small><br>' + s);
    $.ajax({

        url: 'http://104.251.219.215:8080/api/txhash/' + s,
        success: function(data, textStatus, jqXHR) {
            if (data.status == 'Error') {
                console.log('Error: ' + data.error);
                $('#searchID').append('<br><br><small>Error: ' + data.error + '</small>');
            } else {
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
            // var row = $("<tr />");
            // $("#TransT-table").empty(row);
            // _.sortBy(data.transactions, 'block');
            var x = $( window ).width();
            var y = 1
                if (x>640) {y = 2}
                if (x>660) {y = 3}
                if (x>680) {y = 4}
                if (x>700) {y = 5}
                if (x>720) {y = 6}
                if (x>740) {y = 7}
                if (x>760) {y = 8}
                if (x>780) {y = 9}
                if (x>800) {y = 10}
                if (x>820) {y = 11}
                if (x>840) {y = 12}
                if (x>860) {y=12}
                if (x>880) {y=12}
                if (x>900) {y=12}
                if (x>920) {y=12}
                if (x>940) {y=14}
                if (x>1040) {y=20}
                if (x>1180) {y=32}
                if (x>1300) {y=36}
                if (x>1420) {y=40}
                  if (x>1520) {y=48}
                    if (x>1620) {y=52}
                      if (x>1720) {y=56}
                        if (x>1820) {y=60}
                if (x>1920){y = 0} 
            _.each(data.transactions, function(object) {
                drawTransRow(y,object.timestamp, object.amount, object.txhash, object.block, object.txfrom, object.txto, object.fee, s);
            });
            var TransT = $("#TransT").DataTable();
            TransT.columns.adjust().draw(true);
            $("#TransT").width("100%");
        }
    });
}






}

$(window).bind('resize', function () {
        /*the line below was causing the page to keep loading.
        $('#tableData').dataTable().fnAdjustColumnSizing();
        Below is a workaround. The above should automatically work.*/
        $('#TransT').css('width', '100%');
        var TransT = $("#TransT").DataTable();
        TransT.columns.adjust().draw(true);
        //console.log($( window ).width());
        rd();
    } );

});


function drawTransRow(cutoff,a,b,c,d,e,f,g,h) {
    // var row = $("<tr />");
    // $("#TransT-table").append(row);
    var x = moment.unix(a);
    // row.append($("<td onclick=\"doSearch('" + c + "')\">" + c.substring(0,16) + "...</td>"));
    // row.append($("<td>" + d + "</td>"));
    // row.append($("<td>" + moment(x).format("HH:mm D MMM YYYY") + "</td>"));
        // row.append($("<td onclick=\"doSearch('" + e + "')\">" + e.substring(0,16) + "...</td>"));

        var z = "";
    if (h == e) {
      if (cutoff<3) {
        z = '<div style=\"text-align: center\"><i class=\"sign out icon\"></i></div>';
      } else {
        z = '<div style=\"text-align: center\">Sent <i class=\"sign out icon\"></i></div>';
      }
      
     } else { 
      if (cutoff<3) {
        z = '<div style=\"text-align: center\"><i class=\"sign in icon\"></i></td></div>';
      } else {
        z = '<div style=\"text-align: center\"><i class=\"sign in icon\"></i> Received</td></div>';
      }
     }
    // row.append($("<td onclick=\"doSearch('" + f + "')\">" + f.substring(0,16) + "...</td>"));
    // row.append($("<td>" + b + "</td>"));
    // row.append($("<td>" + g + "</td>"));
   var t = ""
   if (cutoff<3) {
    t = moment(x).format("HH:mm") + "...";
   } else {
    t= moment(x).format("HH:mm D MMM YYYY");
   }
    var TransT = $("#TransT").DataTable();
    if (cutoff>0) {
    TransT.row.add([c.substring(0,cutoff)+'...',d,t,e.substring(0,cutoff)+'...',  z ,f.substring(0,cutoff)+'...',b,g,c,e,f]);
    } else {
      TransT.row.add([c,d,moment(x).format("HH:mm D MMM YYYY"),e,  z ,f,b,g,c,e,f]);
    }
}

function isInt(value) {
  var x = parseFloat(value);
  return !isNaN(value) && (x | 0) === x;
}