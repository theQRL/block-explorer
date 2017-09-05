import './address.html'
import '../../stylesheets/overrides.css'

Template.address.onCreated(() => {
  Session.set('address', {})
  Session.set('qrl', 0)
  const aId = FlowRouter.getParam('aId')
  if (aId) {
    Meteor.call('address', aId, (err, res) => {
      if (err) {
        Session.set('address', { error: err, id: aId })
      } else {
        Session.set('address', res)
      }
    })
  }
  Meteor.call('QRLvalue', (err, res) => {
    if (err) {
      Session.set('qrl', 'Error getting value from API')
    } else {
      Session.set('qrl', res)
    }
  })
})

Template.address.helpers({
  address() {
    return Session.get('address')
  },
  QRtext() {
    return FlowRouter.getParam('aId')
  },
  ts() {
    const x = moment.unix(this.timestamp)
    return moment(x).format('HH:mm D MMM YYYY')
  },
  qrl() {
    const address = Session.get('address')
    try {
      const value = address.state.balance
      const x = Session.get('qrl')
      return Math.round((x * value) * 100) / 100
    } catch (e) {
      return 0
    }
  },
  txcount() {
    const address = Session.get('address')
    try {
      const y = address.transactions.length
      return y
    } catch (e) {
      return 0
    }
  },
})

Template.address.events({
  'click .refresh': () => {
    Session.set('address', {})
    const aId = FlowRouter.getParam('aId')
    if (aId) {
      Meteor.call('address', aId, (err, res) => {
        if (err) {
          Session.set('address', { error: err })
        } else {
          Session.set('address', res)
        }
      })
    }
  },
  'click .close': () => {
    $('.message').hide()
  },
  'click #ShowTx': () => {
    $('table').show()
    $('#ShowTx').hide()
    $('#HideTx').show()
  },
  'click #HideTx': () => {
    $('table').hide()
    $('#ShowTx').show()
    $('#HideTx').hide()
  },
})

Template.address.onRendered(() => {
  this.$('.value').popup()
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    const aId = FlowRouter.getParam('aId')
    if (aId) {
      Meteor.call('address', aId, (err, res) => {
        if (err) {
          Session.set('address', { error: err })
        } else {
          Session.set('address', res)
        }
      })
    }
  })
})