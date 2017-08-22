import './status.html';

Template.status.onCreated(function statusOnCreated() {
    Session.set("status",{});
    Meteor.call('status', function(err, res) {
      if (err) {
        Session.set("status",{ error: err });
      } else {
        Session.set("status",res);
      }
    });
  });

Template.status.helpers({
    status() {
      return Session.get("status");
    },
    uptime() {
      var x = Session.get("status");
      x = x.network_uptime;
      return moment("1900-01-01 00:00:00").add(x, 'seconds').format("d[d] h[h] mm[min]");
    }
});

Template.status.events({
  'click .refresh' (event, instance) {
    Session.set("status",{});
    Meteor.call('status', function(err, res) {
      if (err) {
        Session.set("status",{ error: err });
      } else {
        Session.set("status",res);
      }
    });
  },
  'click .close' : function(){
    $('.message').hide();
  }
});