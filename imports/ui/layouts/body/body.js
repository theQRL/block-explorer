import './body.html'
import './sidebar.html'
import { EXPLORER_VERSION } from '../../../startup/both/index.js'

BlazeLayout.setRoot('body')
Template.appBody.onRendered(() => {
  $('.ui.dropdown').dropdown()
  $('.modal').modal()
  // $('.sidebar').first().sidebar('attach events', '#hamburger', 'show')

  Session.set('connectionStatus', {})
  Meteor.call('connectionStatus', (err, res) => {
    if (err) {
      Session.set('connectionStatus', { error: err, colour: 'red' })
    } else {
      Session.set('connectionStatus', res)
    }
  })
})

Template.appBody.events({
  /*
  'click #hamburger': (event) => {
    event.preventDefault()
    $('.ui.sidebar').sidebar('toggle')
  },
  */
  'change #addressFormatCheckbox': () => {
    const checked = $('#addressFormatCheckbox').prop('checked')
    if (checked) {
      Session.set('addressFormat', 'bech32')
    } else {
      Session.set('addressFormat', 'hex')
    }
  },
  'click #sidebarConnectionStatus': () => {
    // TODO: modal here
  },
  'click #reconnect, click #reconnect-close': () => {
    Meteor.reconnect()
    $('.rv-vanilla-modal-overlay-fi').removeClass('is-shown')
    $('.rv-vanilla-modal-overlay-fi').hide()
    $('.rv-vanilla-modal-fi').removeClass('rv-vanilla-modal-is-open')
    $('#target-modal').hide()
  },
})

Template.appBody.helpers({
  /* Active Menu Item Helpers */
  menuBlocksActive() {
    if (
      (FlowRouter.getRouteName() === 'Block.home') ||
      (FlowRouter.getRouteName() === 'Lastblocks.home')
    ) {
      return 'active'
    }
    return ''
  },
  menuTransactionsActive() {
    if (
      (FlowRouter.getRouteName() === 'Lasttx.home') ||
      (FlowRouter.getRouteName() === 'Tx.home') ||
      (FlowRouter.getRouteName() === 'Address.home')
    ) {
      return 'active'
    }
    return ''
  },
  menuUnconfirmedTransactionsActive() {
    if (
      (FlowRouter.getRouteName() === 'Lastunconfirmedtx.home')
    ) {
      return 'active'
    }
    return ''
  },
  menuPeersActive() {
    if (
      (FlowRouter.getRouteName() === 'Peerstats.home')
    ) {
      return 'active'
    }
    return ''
  },
  qrlExplorerVersion() {
    return EXPLORER_VERSION
  },
  connectionStatus() {
    return Session.get('connectionStatus')
  },
})

Template.sidebar.events({
  click: (event) => {
    if (event.target.tagName !== 'INPUT') {
      $('.ui.sidebar').sidebar('toggle')
    }
  },
})
