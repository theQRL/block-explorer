import './address.html';
import '../../stylesheets/overrides.css';

Template.address.onCreated(function addressOnCreated() {
    Session.set("address",{});
    Session.set("qrl",0);
    var aId = FlowRouter.getParam("aId");
    Meteor.call('address', aId, function(err, res) {
      if (err) {
        Session.set("address",{ error: err, id: aId });
      } else {
        Session.set("address",res);
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

Template.address.helpers({
    address() {
      return Session.get("address");
    },
    QRtext() {
        return FlowRouter.getParam("aId");
     },
     ts() {
      var x = moment.unix(this.timestamp);
      return moment(x).format("HH:mm D MMM YYYY");
     },
     qrl() {
       const address = Session.get("address");
       try {
       const value = address.state.balance;
       var x = Session.get("qrl");
       return Math.round((x * value)*100)/100;
     } catch(e) {
      return 0
     }
     },
     txcount() {
      const address = Session.get("address");
      try {
          y = address.transactions.length;
          return y
        } catch(e) {
          return 0
        }  
      }
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
  },
  'click #ShowTx' : function() {
    $('table').show();
    $('#ShowTx').hide();
    $('#HideTx').show();
  },
  'click #HideTx' : function() {
    $('table').hide();
    $('#ShowTx').show();
    $('#HideTx').hide();
  },
});

Template.address.rendered = function() {
  this.$('.value').popup();
  Tracker.autorun(function() {
      FlowRouter.watchPathChange();
      var context = FlowRouter.current();
      var aId = FlowRouter.getParam("aId");
      Meteor.call('address', aId, function(err, res) {
        if (err) {
          Session.set("address",{ error: err });
        } else {
          Session.set("address",res);
        }
      });
  });
}