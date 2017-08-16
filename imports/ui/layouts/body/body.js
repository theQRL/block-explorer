import './body.html';
Template.App_body.rendered = function () {
   this.$('.ui.dropdown').dropdown();
  this.$('.sidebar').first().sidebar('attach events', '#hamburger', 'show');
};
Template.App_body.events({
  'click .search, click #sideSearch': function () {
    console.log("doing search");
  }
});