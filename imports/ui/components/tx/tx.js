import './tx.html'
import '../../stylesheets/overrides.css'


Template.tx.onCreated(() => {
  Session.set('txhash', {})
  Session.set('qrl', 0)
  Session.set('status', {})
  const txId = FlowRouter.getParam('txId')
  if (txId) {
    Meteor.call('txhash', txId, (err, res) => {
      if (err) {
        Session.set('txhash', { error: err, id: txId })
      } else {
        Session.set('txhash', res)
      }
    })
    Meteor.call('QRLvalue', (err, res) => {
      if (err) {
        Session.set('qrl', 'Error getting value from API')
      } else {
        Session.set('qrl', res)
      }
    })
    Meteor.call('status', (err, res) => {
      if (err) {
        Session.set('status', { error: err })
      } else {
        Session.set('status', res)
      }
    })
  }
})

Template.tx.helpers({
  tx() {
    return Session.get('txhash').transaction
  },
  header() {
    return Session.get('txhash').transaction.header
  },
  qrl() {
    const txhash = Session.get('txhash')
    try {
      const value = txhash.amount
      const x = Session.get('qrl')
      return Math.round((x * value) * 100) / 100
    } catch (e) {
      return 0
    }
  },
  confirmations() {
    const x = Session.get('status')
    try {
      return x.node_info.block_height - this.header.block_number
    } catch (e) {
      return 0
    }
  },
  ts() {
    const x = moment.unix(this.header.timestamp.seconds)
    return moment(x).format('HH:mm D MMM YYYY')
  },
  color() {
    if (this.tx.transactionType === 'coinbase') {
      return 'teal'
    }
    if (this.tx.transactionType === 'stake') {
      return 'red'
    }
    if (this.tx.transactionType === 'transfer') {
      return 'yellow'
    }
    return ''
  },
  json() {
    // TODO: Improve the formatting here
    const myJSON = JSON.stringify(this.tx, null, 4)
    return myJSON.replace(new RegExp('\\\\n', 'g'), '<br />')
  },
})

Template.tx.events({
  'click .close': () => {
    $('.message').hide()
  },
  'click .jsonclick': () => {
    $('.jsonbox').toggle()
  },
})

Template.tx.onRendered(() => {
  this.$('.value').popup()
})
