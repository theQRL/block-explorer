import './status.html';

Template.status.onCreated(function statusOnCreated() {
    Session.set("status",{});
    Meteor.call('status', function(err, res) {
    // The method call sets the Session variable to the callback value
      if (err) {
        Session.set("status",{ error: err });
      } else {
        Session.set("status",res);
      }
    });
  });

Template.status.helpers({
    status() {
        return Session.get("status");
    },
});

Template.status.events({
  'click .refresh' (event, instance) {
    Meteor.call('status', function(err, res) {
    // The method call sets the Session variable to the callback value
      if (err) {
        Session.set("status",{ error: err });
      } else {
        Session.set("status",res);
      }
    });
  },
});