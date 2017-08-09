import './tx.html';

Template.tx.onCreated(function txOnCreated() {
    Session.set("txhash",{});
    var txId = FlowRouter.getParam("txId");
    Meteor.call('txhash', txId, function(err, res) {
    // The method call sets the Session variable to the callback value
      if (err) {
        Session.set("txhash",{ error: err });
      } else {
        Session.set("txhash",res);
      }
    });
  });

Template.tx.helpers({
    txhash() {
        return Session.get("txhash");
    },
});