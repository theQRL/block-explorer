import './lastunconfirmedtx.html'
import { numberToString, SHOR_PER_QUANTA } from '../../../startup/both/index.js'
import { lasttx } from '/imports/api/index.js'

Template.lastunconfirmedtx.onCreated(() => {
  Meteor.subscribe('lasttx')
})

Template.lastunconfirmedtx.helpers({
  lastunconfirmedtx() {
    const res = lasttx.findOne()
    if (res && res.transactions) {
      // Filter for unconfirmed transactions (those without block_number or with block_number = null)
      const unconfirmedTransactions = res.transactions.filter(tx => 
        !tx.header || !tx.header.block_number || tx.header.block_number === null
      )
      return {
        transactions_unconfirmed: unconfirmedTransactions,
        hasUnconfirmedTransactions: unconfirmedTransactions.length > 0
      }
    }
    return { transactions_unconfirmed: [], hasUnconfirmedTransactions: false }
  },
  allConfirmed() {
    const res = lasttx.findOne()
    if (res && res.transactions) {
      const unconfirmedTransactions = res.transactions.filter(tx => 
        !tx.header || !tx.header.block_number || tx.header.block_number === null
      )
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
