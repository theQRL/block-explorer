import './address.html';

Template.address.onCreated(function addressOnCreated() {
    Session.set("address",{});
    var aId = FlowRouter.getParam("aId");
    Meteor.call('address', aId, function(err, res) {
    // The method call sets the Session variable to the callback value
      if (err) {
        Session.set("address",{ error: err });
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