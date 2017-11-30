import JSONFormatter from 'json-formatter-js'
import './tx.html'
import '../../stylesheets/overrides.css'


Template.tx.onCreated(() => {
  Session.set('txhash', {})
  Session.set('qrl', 0)
  const txId = FlowRouter.getParam('txId')
  if (txId) {
    Meteor.call('txhash', txId, (err, res) => {
      if (err) {
        Session.set('txhash', { error: err, id: txId })
      } else {

        // TODO: This could probably be unified with block
        res.transaction.amount = parseFloat(res.transaction.amount)
        res.transaction.addr_from = Buffer.from(res.transaction.addr_from).toString()
        res.transaction.transaction_hash = Buffer.from(res.transaction.transaction_hash).toString('hex')

        res.transaction.addr_from = Buffer.from(res.transaction.addr_from).toString()

        res.transaction.addr_to = ''
        res.transaction.amount = ''
        if(res.transaction.coinbase)
        {
          res.transaction.addr_to = Buffer.from(res.transaction.coinbase.addr_to).toString()
          // FIXME: We need a unified way to format Quantas
          res.transaction.amount = res.transaction.coinbase.amount * 1e-8
        }
        if(res.transaction.transfer)
        {
          res.transaction.addr_to = Buffer.from(res.transaction.transfer.addr_to).toString()
          // FIXME: We need a unified way to format Quantas
          res.transaction.amount = res.transaction.transfer.amount * 1e-8
        }

        res.transaction.public_key = Buffer.from(res.transaction.public_key).toString('hex')
        res.transaction.signature = Buffer.from(res.transaction.signature).toString('hex')

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
  }
})

Template.tx.helpers({
  tx() {
    return Session.get('txhash').transaction
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
  ts() {
    const x = moment.unix(this.timestamp)
    return moment(x).format('HH:mm D MMM YYYY')
  },
  color() {
    if (this.transactionType === 'coinbase') {
      return 'teal'
    }
    if (this.transactionType === 'stake') {
      return 'red'
    }
    if (this.transactionType === 'transfer') {
      return 'yellow'
    }
    return ''
  },
  json() {
    // TODO: Improve the formatting here
    const myJSON = JSON.stringify(this, null, 4)
    return myJSON.replace(new RegExp("\\\\n", "g"), "<br />");
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
