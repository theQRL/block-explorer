import './lastunconfirmedtx.html'
import { numberToString, SHOR_PER_QUANTA } from '../../../startup/both/index.js'

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
  'click .refresh': () => {
    Session.set('lastunconfirmedtx', {})
    Meteor.call('lastunconfirmedtx', (err, res) => {
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
