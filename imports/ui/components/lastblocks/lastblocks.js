import './lastblocks.html';

Template.lastblocks.onCreated(function lastblocksOnCreated() {
    Session.set("lastblocks",{});
    Meteor.call('lastblocks', function(err, res) {
    // The method call sets the Session variable to the callback value
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
  'click button' (event, instance) {
    Meteor.call('lastblocks', function(err, res) {
    // The method call sets the Session variable to the callback value
      if (err) {
        Session.set("lastblocks",{ error: err });
      } else {
        Session.set("lastblocks",res);
      }
    });
  },
});