import { lasttx } from '/imports/api/index.js'
import './lasttx.html'

Template.lasttx.onCreated(() => {
  Meteor.subscribe('lasttx')
})

Template.lasttx.helpers({
  lasttx() {    
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
    const x = lasttx.findOne()
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
  },
  isConfirmed(confirmed) {
    if(confirmed == "true") {
      return true
    }
    return false
  }
})
