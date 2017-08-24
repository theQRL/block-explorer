import './body.html';
import './sidebar.html';
BlazeLayout.setRoot('body');
Template.App_body.rendered = function () {
   $('.ui.dropdown').dropdown();
   $('.modal').modal();
  $('.sidebar').first().sidebar('attach events', '#hamburger', 'show');
};
Template.App_body.events({
  'click #hamburger': function(e) {
    e.preventDefault();
    $('.ui.sidebar').sidebar('toggle');

  },
  'click .search': function (e) {
    console.log('search clicked');
    console.log($(e.currentTarget).prev().val());
    var s = $(e.currentTarget).prev().val();
    // check if s is an integer
    var x = parseFloat(s);
    if ((!isNaN(x) && (x | 0) === x)) {
      console.log('likely a block number');
      FlowRouter.go('/block/'+x);
    } else {
      if (s.length == 69 && s.charAt(0) == 'Q') {
        console.log("Searching for address");
        FlowRouter.go('/a/'+s);
        // ADDRESS display
      } else {
        if (s.length == 64) {
          console.log('search string is likely a txhash');
          FlowRouter.go('/tx/'+s);
        } else {
          console.log('not sure what is being searched for...');
        }
      }
    }
  },
  'keypress input': function(e) {
      if (event.keyCode == 13) {
          console.log('search clicked');
          if($(':focus').is('input')){
            var s = $(':focus').val();
            // check if s is an integer
            var x = parseFloat(s);
            if ((!isNaN(x) && (x | 0) === x)) {
              console.log('likely a block number');
              FlowRouter.go('/block/'+x);
            } else {
              if (s.length == 69 && s.charAt(0) == 'Q') {
                console.log("Searching for address");
                FlowRouter.go('/a/'+s);
                // ADDRESS display
              } else {
                if (s.length == 64) {
                  console.log('search string is likely a txhash');
                  FlowRouter.go('/tx/'+s);
                } else {
                  console.log('not sure what is being searched for...');
                }
              }
            }
            event.stopPropagation();
            return false;
          }
      }
  }
});

Template.sidebar.events({
  'click' :function(e){
    if (e.target.tagName === 'INPUT'){
    } else {
      $('.ui.sidebar').sidebar('toggle');
    }
  }
});