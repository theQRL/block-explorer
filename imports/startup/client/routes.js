import { FlowRouter } from 'meteor/kadira:flow-router'
import { BlazeLayout } from 'meteor/kadira:blaze-layout'

// Import needed templates
import '../../ui/layouts/body/body.html'
import '../../ui/layouts/body/body.js'
import '../../ui/pages/home/home.html'
import '../../ui/pages/home/home.js'
import '../../ui/pages/not-found/not-found.html'
import '../../ui/pages/not-found/not-found.js'
import '../../ui/components/tx/tx.js'
import '../../ui/components/address/address.js'
import '../../ui/components/lastblocks/lastblocks.js'
import '../../ui/components/lasttx/lasttx.js'
import '../../ui/components/lastunconfirmedtx/lastunconfirmedtx.js'
import '../../ui/components/block/block.js'
import '../../ui/components/peerstats/peerstats.js'
import '../../ui/components/search/search.js'
import '../../ui/components/richlist/richlist.js'
import '../../ui/components/status/status.html'
import '../../ui/components/status/status.js'

// Set up all routes in the app

FlowRouter.route('/', {
  name: 'App.home',
  action() {
    BlazeLayout.render('appBody', { main: 'appHome' })
  },
})
FlowRouter.route('/tx/:txId', {
  name: 'Tx.home',
  action() {
    BlazeLayout.render('appBody', { main: 'tx' })
  },
})
FlowRouter.route('/block/:blockId', {
  name: 'Block.home',
  action() {
    BlazeLayout.render('appBody', { main: 'block' })
  },
})
FlowRouter.route('/a/:aId/:tPage?', {
  name: 'Address.home',
  action() {
    BlazeLayout.render('appBody', { main: 'address' })
  },
})
FlowRouter.route('/lastblocks', {
  name: 'Lastblocks.home',
  action() {
    BlazeLayout.render('appBody', { main: 'lastblocks' })
  },
})
FlowRouter.route('/richlist', {
  name: 'Richlist.home',
  action() {
    BlazeLayout.render('appBody', { main: 'richlist' })
  },
})
FlowRouter.route('/status', {
  name: 'Status.home',
  action() {
    BlazeLayout.render('appBody', { main: 'status' })
  },
})
FlowRouter.route('/search', {
  name: 'Search.home',
  action() {
    BlazeLayout.render('appBody', { main: 'search' })
  },
})
FlowRouter.route('/lasttx', {
  name: 'Lasttx.home',
  action() {
    BlazeLayout.render('appBody', { main: 'lasttx' })
  },
})
FlowRouter.route('/unconfirmed', {
  name: 'Lastunconfirmedtx.home',
  action() {
    BlazeLayout.render('appBody', { main: 'lastunconfirmedtx' })
  },
})
FlowRouter.route('/peers', {
  name: 'Peerstats.home',
  action() {
    BlazeLayout.render('appBody', { main: 'peerstats' })
  },
})
FlowRouter.notFound = {
  action() {
    BlazeLayout.render('appBody', { main: 'notFound' })
  },
}
