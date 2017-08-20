import './block.html';

Template.block.onCreated(function blockOnCreated() {
    Session.set("block",{});
    var blockId = parseInt(FlowRouter.getParam("blockId"));
    Meteor.call('block', blockId, function(err, res) {
    // The method call sets the Session variable to the callback value
      if (err) {
        Session.set("block",{ error: err, id: blockId });
      } else {
        Session.set("block",res);
      }
    });
  });

Template.block.helpers({
    block() {
      return Session.get("block");
    },
    blockdata() {
      return JSON.stringify(Session.get("block"), true, 2);
    }
});

Template.block.events({
  'click .close' : function(){
    $('.message').hide();
  }
});