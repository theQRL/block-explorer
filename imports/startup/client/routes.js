import { FlowRouter } from 'meteor/kadira:flow-router'
import { BlazeLayout } from 'meteor/kadira:blaze-layout'

// Import needed templates
import '../../ui/layouts/body/body.js'
import '../../ui/pages/home/home.js'
import '../../ui/pages/not-found/not-found.js'
import '../../ui/components/tx/tx.js'
import '../../ui/components/address/address.js'
import '../../ui/components/stakers/stakers.js'
import '../../ui/components/nextstakers/nextstakers.js'
import '../../ui/components/lastblocks/lastblocks.js'
import '../../ui/components/lasttx/lasttx.js'
import '../../ui/components/lastunconfirmedtx/lastunconfirmedtx.js'
import '../../ui/components/richlist/richlist.js'
import '../../ui/components/block/block.js'

// Set up all routes in the app
FlowRouter.route('/', {
  name: 'App.home',
  action() {
    BlazeLayout.render('appBody', { main: 'appHome' })
  },
})
FlowRouter.route('/stakers', {
  name: 'Stakers.home',
  action() {
    BlazeLayout.render('appBody', { main: 'stakers' })
  },
})
FlowRouter.route('/nextstakers', {
  name: 'NextStakers.home',
  action() {
    BlazeLayout.render('appBody', { main: 'nextstakers' })
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
FlowRouter.route('/a/:aId', {
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
FlowRouter.route('/richlist', {
  name: 'Richlist.home',
  action() {
    BlazeLayout.render('appBody', { main: 'richlist' })
  },
})
FlowRouter.notFound = {
  action() {
    BlazeLayout.render('appBody', { main: 'appBotFound' })
  },
}
