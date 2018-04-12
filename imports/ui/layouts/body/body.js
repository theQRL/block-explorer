import './body.html'
import './sidebar.html'
import { EXPLORER_VERSION } from '../../../startup/both/index.js'

BlazeLayout.setRoot('body')
Template.appBody.onRendered(() => {
  $('.ui.dropdown').dropdown()
  $('.modal').modal()
  //$('.sidebar').first().sidebar('attach events', '#hamburger', 'show')

  Session.set('connectionStatus', {})
  Meteor.call('connectionStatus', (err, res) => {
    if (err) {
      Session.set('connectionStatus', { error: err, colour: 'red' })
    } else {
      Session.set('connectionStatus', res)
    }
  })
})

const identifySearch = (str) => {
  const type = { parameter: str, type: 'Undetermined' }
  if (str.length === 79 && str.charAt(0) === 'Q') {
    type.type = 'Address'
    type.route = `/a/${str}`
  }
  if ((str.length === 64) && (parseInt(str, 10) !== str)) {
    type.type = 'Txhash'
    type.route = `/tx/${str}`
  }
  if ((parseInt(str, 10).toString()) === str) {
    type.type = 'Block'
    type.route = `/block/${str}`
  }
  return type
}

const postSearch = (results) => {
  if (results.type !== 'Undetermined') {
    FlowRouter.go(results.route)
  }
}

Template.appBody.events({
  /*
  'click #hamburger': (event) => {
    event.preventDefault()
    $('.ui.sidebar').sidebar('toggle')
  },
  */
  'click .search': (event) => {
    const s = $(event.currentTarget).prev().val()
    postSearch(identifySearch(s))
  },
  'keypress #mainSearch': (event) => {
    if (event.keyCode === 13) {
      // console.log('search clicked')
      if ($(':focus').is('input')) {
        const s = $(':focus').val()
        postSearch(identifySearch(s))
        event.stopPropagation()
        return false
      }
    }
    return true
  },
})

Template.appBody.helpers({
  /* Active Menu Item Helpers */
  menuBlocksActive() {
    if(
      (FlowRouter.getRouteName() == "Block.home") ||
      (FlowRouter.getRouteName() == "Lastblocks.home")
      
      ) {
      return 'active'
    }
  },
  menuTransactionsActive() {
    if(
      (FlowRouter.getRouteName() == "Lasttx.home") ||
      (FlowRouter.getRouteName() == "Tx.home") || 
      (FlowRouter.getRouteName() == "Address.home")
      ) {
      return 'active'
    }
  },
  menuUnconfirmedTransactionsActive() {
    if(
      (FlowRouter.getRouteName() == "Lastunconfirmedtx.home")
      ) {
      return 'active'
    }
  },
  qrlExplorerVersion() {
    return EXPLORER_VERSION
  },
  connectionStatus() {
    return Session.get('connectionStatus')
  }
})

Template.sidebar.events({
  click: (event) => {
    if (event.target.tagName !== 'INPUT') {
      $('.ui.sidebar').sidebar('toggle')
    }
  },
})
