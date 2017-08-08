import './hello.html';

Template.hello.onCreated(function helloOnCreated() {
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

Template.hello.helpers({
    status() {
        return Session.get("status");
    },
});

Template.hello.events({
  'click button' (event, instance) {
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