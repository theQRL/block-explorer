import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Import needed templates
import '../../ui/layouts/body/body.js';
import '../../ui/pages/home/home.js';
import '../../ui/pages/not-found/not-found.js';
import '../../ui/components/tx/tx.js';
import '../../ui/components/address/address.js';
import '../../ui/components/stakers/stakers.js';
import '../../ui/components/nextstakers/nextstakers.js';
import '../../ui/components/lastblocks/lastblocks.js';
import '../../ui/components/lasttx/lasttx.js';
import '../../ui/components/richlist/richlist.js';
import '../../ui/components/block/block.js';

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
FlowRouter.route('/block/:blockId', {
  name: 'Block.home',
  action(params) {
    BlazeLayout.render('App_body', { main: 'block' });
  },
});
FlowRouter.route('/a/:aId', {
  name: 'Address.home',
  action(params) {
    BlazeLayout.render('App_body', { main: 'address' });
  },
});
FlowRouter.route('/lastblocks', {
  name: 'Lastblocks.home',
  action() {
    BlazeLayout.render('App_body', { main: 'lastblocks' });
  },
});
FlowRouter.route('/lasttx', {
  name: 'Lasttx.home',
  action() {
    BlazeLayout.render('App_body', { main: 'lasttx' });
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
