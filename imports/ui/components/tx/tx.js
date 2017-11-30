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
        res.transaction.tx.addr_from = Buffer.from(res.transaction.tx.addr_from).toString()
        res.transaction.tx.transaction_hash = Buffer.from(res.transaction.tx.transaction_hash).toString('hex')

        res.transaction.tx.addr_to = ''
        res.transaction.tx.amount = ''
        if(res.transaction.coinbase)
        {
          res.transaction.tx.addr_to = Buffer.from(res.transaction.tx.coinbase.addr_to).toString()
          res.transaction.tx.coinbase.addr_to = Buffer.from(res.transaction.tx.coinbase.addr_to).toString()
          // FIXME: We need a unified way to format Quanta
          res.transaction.tx.amount = res.transaction.tx.coinbase.amount * 1e-8
        }
        if(res.transaction.tx.transfer)
        {
          res.transaction.tx.addr_to = Buffer.from(res.transaction.tx.transfer.addr_to).toString()
          res.transaction.tx.transfer.addr_to = Buffer.from(res.transaction.tx.transfer.addr_to).toString()
          // FIXME: We need a unified way to format Quanta
          res.transaction.tx.amount = res.transaction.tx.transfer.amount * 1e-8
        }

        res.transaction.tx.public_key = Buffer.from(res.transaction.tx.public_key).toString('hex')
        res.transaction.tx.signature = Buffer.from(res.transaction.tx.signature).toString('hex')

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
    } catch (e) { }
    return 0
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
