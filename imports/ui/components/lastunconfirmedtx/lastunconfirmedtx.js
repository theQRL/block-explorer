import './lastunconfirmedtx.html'

Template.lastunconfirmedtx.onCreated(() => {
  Session.set('lastunconfirmedtx', {})
  Meteor.call('lastunconfirmedtx', (err, res) => {
    // The method call sets the Session variable to the callback value
    if (err) {
      Session.set('lastunconfirmedtx', { error: err })
    } else {
      Session.set('lastunconfirmedtx', res)
    }
  })
})

Template.lastunconfirmedtx.helpers({
  lastunconfirmedtx() {
    return Session.get('lastunconfirmedtx')
  },
  allConfirmed() {
    try {
      if (this.transactions.length === 0) {
        return true
      }
    } catch (e) {
      return false
    }
    return false
  },
})

Template.lastunconfirmedtx.events({
  'click .refresh': () => {
    Session.set('lastunconfirmedtx', {})
    Meteor.call('lastunconfirmedtx', (err, res) => {
      // The method call sets the Session variable to the callback value
      if (err) {
        Session.set('lastunconfirmedtx', { error: err })
      } else {
        Session.set('lastunconfirmedtx', res)
      }
    })
  },
  'click .close': () => {
    $('.message').hide()
  },
})
