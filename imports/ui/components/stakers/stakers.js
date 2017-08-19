import './stakers.html';

Template.stakers.onCreated(function stakersOnCreated() {
    Session.set("stakers",{});
    Meteor.call('stakers', function(err, res) {
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
  'click .refresh' (event, instance) {
    Session.set("stakers",{});
    Meteor.call('stakers', function(err, res) {
      if (err) {
        Session.set("stakers",{ error: err });
      } else {
        Session.set("stakers",res);
      }
    });
  },
  'click .close' : function(){
    $('.message').hide();
  }
});