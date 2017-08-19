import './address.html';
import '../../stylesheets/overrides.css';

Template.address.onCreated(function addressOnCreated() {
    Session.set("address",{});
    var aId = FlowRouter.getParam("aId");
    Meteor.call('address', aId, function(err, res) {
      if (err) {
        Session.set("address",{ error: err, id: aId });
      } else {
        Session.set("address",res);
      }
    });
  });

Template.address.helpers({
    address() {
      return Session.get("address");
    },
});

Template.address.events({
  'click .refresh': function(){
    Session.set("address",{});
    var aId = FlowRouter.getParam("aId");
    Meteor.call('address', aId, function(err, res) {
      if (err) {
        Session.set("address",{ error: err });
      } else {
        Session.set("address",res);
      }
    });
  },
  'click .close' : function(){
    $('.message').hide();
  }
});