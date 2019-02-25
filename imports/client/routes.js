import { FlowRouter } from 'meteor/kadira:flow-router'
import { BlazeLayout } from 'meteor/kadira:blaze-layout'

FlowRouter.route('/', {
  name: 'Explorer.home',
  action() {
    BlazeLayout.render('body', { main: 'home' })
  },
})
FlowRouter.route('/tx/:txId', {
  name: 'Tx.home',
  action() {
    BlazeLayout.render('body', { main: 'tx' })
  },
})
FlowRouter.route('/block/:blockId', {
  name: 'Block.home',
  action() {
    BlazeLayout.render('body', { main: 'block' })
  },
})
FlowRouter.route('/a/:aId/:tPage?', {
  name: 'Address.home',
  action() {
    BlazeLayout.render('body', { main: 'address' })
  },
})
// FlowRouter.route('/lastblocks', {
//   name: 'Lastblocks.home',
//   action() {
//     BlazeLayout.render('appBody', { main: 'lastblocks' })
//   },
// })
// FlowRouter.route('/status', {
//   name: 'Status.home',
//   action() {
//     BlazeLayout.render('appBody', { main: 'status' })
//   },
// })
// FlowRouter.route('/search', {
//   name: 'Search.home',
//   action() {
//     BlazeLayout.render('appBody', { main: 'search' })
//   },
// })
// FlowRouter.route('/lasttx', {
//   name: 'Lasttx.home',
//   action() {
//     BlazeLayout.render('appBody', { main: 'lasttx' })
//   },
// })
// FlowRouter.route('/unconfirmed', {
//   name: 'Lastunconfirmedtx.home',
//   action() {
//     BlazeLayout.render('appBody', { main: 'lastunconfirmedtx' })
//   },
// })
// FlowRouter.route('/peers', {
//   name: 'Peerstats.home',
//   action() {
//     BlazeLayout.render('appBody', { main: 'peerstats' })
//   },
// })
// FlowRouter.notFound = {
//   action() {
//     BlazeLayout.render('appBody', { main: 'appBotFound' })
//   },
// }
