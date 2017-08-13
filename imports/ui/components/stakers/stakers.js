import './stakers.html';

Template.stakers.onCreated(function stakersOnCreated() {
    Session.set("stakers",{});
    Meteor.call('stakers', function(err, res) {
    // The method call sets the Session variable to the callback value
      if (err) {
        Session.set("stakers",{ error: err });
      } else {
        Session.set("stakers",res);
      }
    });
  });

Template.stakers.helpers({
    stakers() {
        return Session.get("stakers");
    },
});

Template.stakers.events({
  'click button' (event, instance) {
    Meteor.call('stakers', function(err, res) {
    // The method call sets the Session variable to the callback value
      if (err) {
        Session.set("stakers",{ error: err });
      } else {
        Session.set("stakers",res);
      }
    });
  },
});