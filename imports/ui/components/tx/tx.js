import './tx.html';
import '../../stylesheets/overrides.css';

Template.tx.onCreated(function txOnCreated() {
    Session.set("txhash",{});
    var txId = FlowRouter.getParam("txId");
    Meteor.call('txhash', txId, function(err, res) {
      if (err) {
        Session.set("txhash",{ error: err, id: txId });
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

Template.tx.events({
  'click .close' : function(){
    $('.message').hide();
  }
})