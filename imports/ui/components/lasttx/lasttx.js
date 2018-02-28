import { lasttx } from '/imports/api/index.js'
import './lasttx.html'

const renderLastTxBlock = () => {
  /*
  Meteor.call('lasttx', (err, res) => {
    // The method call sets the Session variable to the callback value
    if (err) {
      Session.set('lasttx', { error: err })
    } else {
      Session.set('lasttx', res)
    }
  })
  */

  const res = lasttx.findOne()
  Session.set('lasttx', res)
}

Template.lasttx.onCreated(() => {
  Session.set('lasttx', {})
  Meteor.subscribe('lasttx')
  renderLastTxBlock()
})

Template.lasttx.helpers({
  lasttx() {    
    //return Session.get('lasttx')
    const res = lasttx.findOne()
    return res
  },
  amount() {
    if (this.tx.coinbase) {
      return (this.tx.coinbase.amount / SHOR_PER_QUANTA).toFixed(9)
    }
    if (this.tx.transfer) {
      return (this.tx.transfer.amount / SHOR_PER_QUANTA).toFixed(9)
    }
    if(this.tx.transfer_token) {
      return (this.tx.transfer_token.amount / SHOR_PER_QUANTA).toFixed(9)
    }
    return ''
  },
  tx_hash() {
    return Buffer.from(this.tx.transaction_hash).toString('hex')
  },
  block() {
    return this.header.block_number
  },
  ts() {
    const x = moment.unix(this.header.timestamp_seconds)
    return moment(x).format('HH:mm D MMM YYYY')
  },
  zeroCheck() {
    let ret = false
    const x = Session.get('lasttx').transactions
    if (x) { if (x.length === 0) { ret = true } }
    if (x === undefined) { ret = true }
    return ret
  },
  isTransfer(txType) {
    if(txType == "transfer") {
      return true
    }
    return false
  },
  isTokenCreation(txType) {
    if(txType == "token") {
      return true
    }
    return false
  },
  isTokenTransfer(txType) {
    if(txType == "transfer_token") {
      return true
    }
    return false
  },
  isCoinbaseTxn(txType) {
    if(txType == "coinbase") {
      return true
    }
    return false
  },
  isSlaveTxn(txType) {
    if(txType == "slave") {
      return true
    }
    return false
  },
  isLatticePKTxn(txType) {
    if(txType == "latticePK") {
      return true
    }
    return false
  }
})

Template.lasttx.events({
  'click .refresh': () => {
    renderLastTxBlock()
  },
  'click .close': () => {
    $('.message').hide()
  },
})
