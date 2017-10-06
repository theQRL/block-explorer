import './lasttx.html'

Template.lasttx.onCreated(() => {
  Session.set('lasttx', {})
  Meteor.call('lasttx', (err, res) => {
    // The method call sets the Session variable to the callback value
    if (err) {
      Session.set('lasttx', { error: err })
    } else {
      res.transactions = res.transactions.reverse()
      Session.set('lasttx', res)
    }
  })
})

Template.lasttx.helpers({
  lasttx() {
    return Session.get('lasttx')
  },
  ts() {
    const x = moment.unix(this.timestamp)
    return moment(x).format('HH:mm D MMM YYYY')
  },
})

Template.lasttx.events({
  'click .refresh': () => {
    Session.set('lasttx', {})
    Meteor.call('lasttx', (err, res) => {
      // The method call sets the Session variable to the callback value
      if (err) {
        Session.set('lasttx', { error: err })
      } else {
        Session.set('lasttx', res)
      }
    })
  },
  'click .close': () => {
    $('.message').hide()
  },
})
