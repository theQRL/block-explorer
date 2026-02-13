import './lastunconfirmedtx.html'
import { lasttx } from '/imports/api/index.js'

const getUnconfirmedBorderTypeClass = (txType) => {
  if (txType === 'transfer') {
    return 'border-type-transfer'
  }
  if (txType === 'token' || txType === 'transfer_token') {
    return 'border-type-token'
  }
  if (txType === 'slave') {
    return 'border-type-slave'
  }
  return 'border-type-message'
}

Template.lastunconfirmedtx.onCreated(() => {
  Meteor.subscribe('lasttx')
})

Template.lastunconfirmedtx.helpers({
  lastunconfirmedtx() {
    const res = lasttx.findOne()
    if (res && res.transactions) {
      // Filter for unconfirmed transactions (those without block_number or with block_number = null)
      const unconfirmedTransactions = res.transactions.filter((tx) => !tx.header || !tx.header.block_number || tx.header.block_number === null)
      return {
        transactions_unconfirmed: unconfirmedTransactions,
        hasUnconfirmedTransactions: unconfirmedTransactions.length > 0,
      }
    }
    return { transactions_unconfirmed: [], hasUnconfirmedTransactions: false }
  },
  allConfirmed() {
    const res = lasttx.findOne()
    if (res && res.transactions) {
      const unconfirmedTransactions = res.transactions.filter((tx) => !tx.header || !tx.header.block_number || tx.header.block_number === null)
      return unconfirmedTransactions.length === 0
    }
    return true
  },
  amount() {
    if (this.tx.transfer) {
      return this.explorer.totalTransferred
    }
    if (this.tx.transfer_token) {
      return this.explorer.totalTransferred
    }
    return ''
  },
  fromAddress() {
    if (this.explorer && this.explorer.from_hex) {
      return this.explorer.from_hex
    }
    return ''
  },
  toAddress() {
    if (this.explorer && this.explorer.outputs) {
      if (this.explorer.outputs.length > 1) {
        return `${this.explorer.outputs.length} recipients`
      }
      return this.explorer.outputs[0].address_hex
    }
    return ''
  },
  recipientCount() {
    if (this.explorer && this.explorer.outputs) {
      return this.explorer.outputs.length
    }
    return 0
  },
  multipleDestinations() {
    if (this.explorer && this.explorer.outputs) {
      return this.explorer.outputs.length > 1
    }
    return false
  },
  hasAddressFlow(txType) {
    return txType === 'transfer' || txType === 'transfer_token'
  },
  block() {
    return this.header.block_number
  },
  ts() {
    const x = moment.unix(this.timestamp_seconds)
    return moment(x).format('HH:mm D MMM YYYY')
  },
  zeroCheck() {
    let ret = false
    const x = Session.get('lasttx').transactions
    if (x) { if (x.length === 0) { ret = true } }
    return ret
  },
  borderTypeClass(txType) {
    return getUnconfirmedBorderTypeClass(txType)
  },
  isTransfer(txType) {
    if (txType === 'transfer') {
      return true
    }
    return false
  },
  isTokenCreation(txType) {
    if (txType === 'token') {
      return true
    }
    return false
  },
  isTokenTransfer(txType) {
    if (txType === 'transfer_token') {
      return true
    }
    return false
  },
  isCoinbaseTxn(txType) {
    if (txType === 'coinbase') {
      return true
    }
    return false
  },
  isSlaveTxn(txType) {
    if (txType === 'slave') {
      return true
    }
    return false
  },
  isMessageTxn(txType) {
    if (txType === 'MESSAGE') {
      return true
    }
    return false
  },
  isDocumentNotarisation(txType) {
    if (txType === 'DOCUMENT_NOTARISATION') {
      return true
    }
    return false
  },
  isKeybaseTxn(txType) {
    if (txType === 'KEYBASE') {
      return true
    }
    return false
  },
})

Template.lastunconfirmedtx.events({
  'click .close': () => {
    $('.message').hide()
  },
})
