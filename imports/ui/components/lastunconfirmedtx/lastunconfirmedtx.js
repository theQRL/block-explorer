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
      if (this.transactions_unconfirmed.length === 0) {
        return true
      }
    } catch (e) {
      return false
    }
    return false
  },


  amount() {
    if (this.tx.coinbase) {
      // FIXME: We need a unified way to format Quantas
      return (this.tx.coinbase.amount * 1e-9).toFixed(9)
      // return this.tx.coinbase.amount
    }
    if (this.tx.transfer) {
      // FIXME: We need a unified way to format Quantas
      return (this.tx.transfer.amount * 1e-9).toFixed(9)
      // return this.tx.transfer.amount
    }
    if(this.tx.transfer_token) {
      return (this.tx.transfer_token.amount * 1e-9).toFixed(9)
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
    const x = moment.unix(this.header.timestamp.seconds)
    return moment(x).format('HH:mm D MMM YYYY')
  },
  zeroCheck() {
    let ret = false
    const x = Session.get('lasttx').transactions
    if (x) { if (x.length === 0) { ret = true } }
    return ret
  },
  isTransfer(txType) {
    if(txType == "TRANSFER") {
      return true
    }
    return false
  },
  isTokenCreation(txType) {
    if(txType == "TOKEN") {
      return true
    }
    return false
  },
  isTokenTransfer(txType) {
    if(txType == "TRANSFERTOKEN") {
      return true
    }
    return false
  },
  isCoinbaseTxn(txType) {
    if(txType == "COINBASE") {
      return true
    }
    return false
  },
  isSlaveTxn(txType) {
    if(txType == "SLAVE") {
      return true
    }
    return false
  }
})

Template.lastunconfirmedtx.events({
  'click .refresh': () => {
    Session.set('lastunconfirmedtx', {})
    Meteor.call('lastunconfirmedtx', (err, res) => {
      console.log(res)
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
