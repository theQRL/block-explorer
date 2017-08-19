import './lastblocks.html';

Template.lastblocks.onCreated(function lastblocksOnCreated() {
    Session.set("lastblocks",{});
    Meteor.call('lastblocks', function(err, res) {
      if (err) {
        Session.set("lastblocks",{ error: err });
      } else {
        Session.set("lastblocks",res);
      }
    });
  });

Template.lastblocks.helpers({
    lastblocks() {
      return Session.get("lastblocks");
    },
});

Template.lastblocks.events({
  'click .refresh' (event, instance) {
    Session.set("lastblocks",{});
    Meteor.call('lastblocks', function(err, res) {
      if (err) {
        Session.set("lastblocks",{ error: err });
      } else {
        Session.set("lastblocks",res);
      }
    });
  },
  'click .close' : function(){
    $('.message').hide();
  }
});