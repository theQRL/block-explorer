import './lasttx.html';

Template.lasttx.onCreated(function lasttxOnCreated() {
    Session.set("lasttx",{});
    Meteor.call('lasttx', function(err, res) {
    // The method call sets the Session variable to the callback value
      if (err) {
        Session.set("lasttx",{ error: err });
      } else {
        Session.set("lasttx",res);
      }
    });
  });

Template.lasttx.helpers({
    lasttx() {
        return Session.get("lasttx");
    },
    ts() {
     var x = moment.unix(this.timestamp);
     return moment(x).format("HH:mm D MMM YYYY");
    }
});

Template.lasttx.events({
  'click .refresh' (event, instance) {
    Session.set("lasttx",{});
    Meteor.call('lasttx', function(err, res) {
    // The method call sets the Session variable to the callback value
      if (err) {
        Session.set("lasttx",{ error: err });
      } else {
        Session.set("lasttx",res);
      }
    });
  },
  'click .close' : function(){
    $('.message').hide();
  }
});