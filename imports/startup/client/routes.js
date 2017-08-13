import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import needed templates
import '../../ui/layouts/body/body.js';
import '../../ui/pages/home/home.js';
import '../../ui/pages/not-found/not-found.js';
import '../../ui/components/tx/tx.js';
import '../../ui/components/stakers/stakers.js';
import '../../ui/components/nextstakers/nextstakers.js';
import '../../ui/components/lastblocks/lastblocks.js';
import '../../ui/components/richlist/richlist.js';
// Set up all routes in the app
FlowRouter.route('/', {
  name: 'App.home',
  action() {
    BlazeLayout.render('App_body', { main: 'App_home' });
  },
});
FlowRouter.route('/stakers', {
  name: 'Stakers.home',
  action() {
    BlazeLayout.render('App_body', { main: 'stakers' });
  },
});
FlowRouter.route('/nextstakers', {
  name: 'NextStakers.home',
  action() {
    BlazeLayout.render('App_body', { main: 'nextstakers' });
  },
});
FlowRouter.route('/tx/:txId', {
  name: 'Tx.home',
  action(params) {
    BlazeLayout.render('App_body', { main: 'tx' });
  },
});
FlowRouter.route('/lastblocks', {
  name: 'Lastblocks.home',
  action() {
    BlazeLayout.render('App_body', { main: 'lastblocks' });
  },
});
FlowRouter.route('/richlist', {
  name: 'Richlist.home',
  action() {
    BlazeLayout.render('App_body', { main: 'richlist' });
  },
});
FlowRouter.notFound = {
  action() {
    BlazeLayout.render('App_body', { main: 'App_notFound' });
  },
};
