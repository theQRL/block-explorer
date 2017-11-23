import './lasttx.html'

Template.lasttx.onCreated(() => {
  Session.set('lasttx', {})
  Meteor.call('lasttx', (err, res) => {
    // The method call sets the Session variable to the callback value
    if (err) {
      Session.set('lasttx', { error: err })
    } else {
      res.transactions = res.transactions.reverse()
      const tx = []
      res.transactions.forEach((index) => {
        const obj = index
        obj.amount = parseFloat(obj.amount)
        tx.push(obj)
      })
      res.transactions = tx
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
  zeroCheck() {
    const x = Session.get('lasttx')
    let y = true
    if (x.length > 0) {
      y = false
    }
    return y
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
        res.transactions = res.transactions.reverse()
        const tx = []
        res.transactions.forEach((index) => {
          const obj = index
          obj.amount = parseFloat(obj.amount)
          tx.push(obj)
        })
        res.transactions = tx
        Session.set('lasttx', res)
      }
    })
  },
  'click .close': () => {
    $('.message').hide()
  },
})
