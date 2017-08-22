import './tx.html';
import '../../stylesheets/overrides.css';

Template.tx.onCreated(function txOnCreated() {
    Session.set("txhash",{});
    Session.set("qrl",0);
    var txId = FlowRouter.getParam("txId");
    Meteor.call('txhash', txId, function(err, res) {
      if (err) {
        Session.set("txhash",{ error: err, id: txId });
      } else {
        Session.set("txhash",res);
      }
    });
    Meteor.call('qrl-value', function(err, res){
      if (err) {
        Session.set('qrl', 'Error getting value from API');
      } else {
        Session.set('qrl', res);
      }
    });
  });

Template.tx.helpers({
    txhash() {
      return Session.get("txhash");
    },
    qrl() {
      const txhash = Session.get("txhash");
      const value = txhash.amount;
      var x = Session.get("qrl");
      return Math.round((x * value)*100)/100;
    }
});

Template.tx.events({
  'click .close' : function(){
    $('.message').hide();
  }
});

Template.tx.rendered = function() {
  this.$('.value').popup();
}