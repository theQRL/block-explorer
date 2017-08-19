import './status.html';

Template.status.onCreated(function statusOnCreated() {
    Session.set("status",{});
    Meteor.call('status', function(err, res) {
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
    Session.set("status",{});
    Meteor.call('status', function(err, res) {
      if (err) {
        Session.set("status",{ error: err });
      } else {
        Session.set("status",res);
      }
    });
  },
  'click .close' : function(){
    $('.message').hide();
  }
});