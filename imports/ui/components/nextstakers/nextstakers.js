import './nextstakers.html';

Template.nextstakers.onCreated(function nextstakersOnCreated() {
    Session.set("nextstakers",{});
    Meteor.call('nextstakers', function(err, res) {
      if (err) {
        Session.set("nextstakers",{ error: err });
      } else {
        Session.set("nextstakers",res);
      }
    });
  });

Template.nextstakers.helpers({
    nextstakers() {
      return Session.get("nextstakers");
    },
});

Template.nextstakers.events({
  'click .refresh' (event, instance) {
    Session.set("nextstakers",{});
    Meteor.call('nextstakers', function(err, res) {
      if (err) {
        Session.set("nextstakers",{ error: err });
      } else {
        Session.set("nextstakers",res);
      }
    });
  },
  'click .close' : function(){
    $('.message').hide();
  }
});