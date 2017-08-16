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
});

Template.lasttx.events({
  'click button' (event, instance) {
    Meteor.call('lasttx', function(err, res) {
    // The method call sets the Session variable to the callback value
      if (err) {
        Session.set("lasttx",{ error: err });
      } else {
        Session.set("lasttx",res);
      }
    });
  },
});