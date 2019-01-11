import './body.html'
import './sidebar.html'
import { EXPLORER_VERSION } from '../../../startup/both/index.js'
/* global LocalStore */

const updateStyleSheet = (filename) => {
  const newstylesheet = `${filename}.css`
  if ($('#dynamic_css').length === 0) {
    $('head').append('<link>')
    const css = $('head').children(':last')
    css.attr({
      id: 'dynamic_css',
      rel: 'stylesheet',
      type: 'text/css',
      href: newstylesheet,
    })
  } else {
    $('#dynamic_css').attr('href', newstylesheet)
  }
}

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
  'click #toggleTheme': () => {
    try {
      const x = LocalStore.get('theme')
      if (x === 'dark') {
        LocalStore.set('theme', 'light')
        updateStyleSheet('light')
      } else {
        LocalStore.set('theme', 'dark')
        updateStyleSheet('dark')
      }
    } catch (e) {
      // localstore not supported so work out what theme is in use and switch accordingly
      if ($('.main-content').css('background-image').indexOf('dark') > 0) {
        // light theme in use
        updateStyleSheet('dark')
      } else {
        updateStyleSheet('light')
      }
    }
  },
})

Template.appBody.helpers({
  logo() {
    const x = LocalStore.get('theme')
    if (x === 'light') {
      return '/img/qrl-logo-dark.png'
    }
    return '/img/qrl-logo-white.png'
  },
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
