/* eslint no-console: 0 */
import JSONFormatter from 'json-formatter-js'
import './tx.html'
import CryptoJS from 'crypto-js'
import sha256 from 'sha256'
import { numberToString, SHOR_PER_QUANTA, formatBytes } from '../../../startup/both/index.js'

const renderTxBlock = () => {
  const txId = FlowRouter.getParam('txId')
  if (txId) {
    Meteor.call('txhash', txId, (err, res) => {
      if (err) {
        Session.set('txhash', { error: err, id: txId, found: false })
        return false
      }
      if (res.found) {
        Session.set('txhash', res)
      } else {
        Session.set('txhash', { found: false, id: txId })
        return false
      }
      return true
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
}

/* eslint-disable */
function toHexString(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}
function bytesToHex(bytes) {
  for (var hex = [], i = 0; i < bytes.length; i++) {
    hex.push((bytes[i] >>> 4).toString(16));
    hex.push((bytes[i] & 0xf).toString(16));
  }
  return hex.join("");
}
function byte2bits(a) {
  var tmp = "";
  for (var i = 128; i >= 1; i /= 2) tmp += a & i ? "1" : "0";
  return tmp;
}
function split2Bits(a, n) {
  var buff = "";
  var b = [];
  for (var i = 0; i < a.length; i++) {
    buff += byte2bits(a[i]);
    while (buff.length >= n) {
      b.push(buff.substr(0, n));
      buff = buff.substr(n);
    }
  }
  return [b, buff];
}

function toByteArray(hexString) {
  var result = [];
  while (hexString.length >= 2) {
    result.push(parseInt(hexString.substring(0, 2), 16));
    hexString = hexString.substring(2, hexString.length);
  }
  return result;
}
/* eslint-enable */

Template.tx.helpers({
  bech32() {
    return Session.equals('addressFormat', 'bech32')
  },
  tx() {
    try {
      if (Session.get('txhash').error) {
        return { found: false, parameter: FlowRouter.getParam('txId') }
      }
      const txhash = Session.get('txhash').transaction
      return txhash
    } catch (e) {
      return false
    }
  },
  txSize() {
    try {
      const bytes = Session.get('txhash').transaction.size
      return formatBytes(bytes)
    } catch (e) {
      return false
    }
  },
  id() {
    return FlowRouter.getParam('txId')
  },
  ots_key() {
    try {
      if (Session.get('txhash').found) {
        const txhash = Session.get('txhash').transaction
        const otsKey = parseInt(txhash.tx.signature.substring(0, 8), 16)
        return otsKey
      }
      return ''
    } catch (e) {
      return false
    }
  },
  notFound() {
    try {
      if (Session.get('txhash').found === false) {
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },
  header() {
    try {
      return Session.get('txhash').transaction.header
    } catch (e) {
      return false
    }
  },
  qrl() {
    const txhash = Session.get('txhash')
    try {
      const value = txhash.transaction.tx.amount
      const x = Session.get('qrl')
      const y = Math.round((x * value) * 100) / 100
      if (y !== 0) { return y }
    } catch (e) {
      return '...'
    }
    return '...'
  },
  amount() {
    if (this.tx.coinbase) {
      return numberToString(this.tx.coinbase.amount / SHOR_PER_QUANTA)
    }
    if (this.tx.transactionType === 'transfer') {
      return `${numberToString(this.tx.transfer.totalTransferred)} Quanta`
    }
    if (this.tx.transactionType === 'transfer_token') {
      return `${numberToString(this.tx.transfer_token.totalTransferred)} ${this.tx.transfer_token.symbol}`
    }

    return ''
  },
  isConfirmed() {
    // const x = Session.get('status')
    try {
      if (this.header.block_number !== null) {
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },
  confirmations() {
    const x = Session.get('status')
    try {
      let confirmations = x.node_info.block_height - this.header.block_number
      confirmations += 1
      return confirmations
    } catch (e) {
      return 0
    }
  },
  ts() {
    if (this.header) {
      const x = moment.unix(this.header.timestamp_seconds)
      return moment(x).format('HH:mm D MMM YYYY')
    }
    const x = moment.unix(this.timestamp_seconds)
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
  isToken() {
    if (this.explorer.type === 'CREATE TOKEN') {
      return true
    }
    return false
  },
  isTransfer() {
    if (this.explorer.type === 'TRANSFER') {
      return true
    }
    return false
  },
  isTokenTransfer() {
    if (this.explorer.type === 'TRANSFER TOKEN') {
      return true
    }
    return false
  },
  isNotCoinbase() {
    if (this.explorer.type !== 'COINBASE') {
      return true
    }
    return false
  },
  isKeybase() {
    if (this.explorer.type !== 'KEYBASE') {
      return false
    }
    return true
  },
  isMessage() {
    if (this.explorer.type === 'MESSAGE') {
      return true
    }
    return false
  },
  isMultiSigCreate() {
    if (this.explorer.type === 'MULTISIG_CREATE') {
      return true
    }
    return false
  },
  isMultiSigSpend() {
    if (this.explorer.type === 'MULTISIG_SPEND') {
      return true
    }
    return false
  },
  isLattice() {
    if (this.explorer.type === 'LATTICE PK') {
      return true
    }
    return false
  },
  isDocumentNotarisation() {
    if (this.explorer.type === 'DOCUMENT_NOTARISATION') {
      return true
    }
    return false
  },
  isNotMessage() {
    if ((this.explorer.type !== 'MESSAGE') && (this.explorer.type !== 'DOCUMENT_NOTARISATION') && (this.tx.transactionType !== 'message')) {
      return true
    }
    return false
  },
  isNotMultiSig() {
    if ((this.explorer.type !== 'MULTISIG_CREATE') && (this.explorer.type !== 'MULTISIG_SPEND')) {
      return true
    }
    return false
  },
  isNotLattice() {
    if ((this.explorer.type !== 'LATTICE PK')) {
      return true
    }
    return false
  },
  documentNotarisationVerificationMessage() {
    const message = Session.get('documentNotarisationVerificationMessage')
    return message
  },
  documentNotarisationError() {
    const message = Session.get('documentNotarisationError')
    return message
  },
  multiSigSignatories(ms) {
    const output = []
    if (ms) {
      _.each(ms.signatories, (item, index) => {
        output.push({ address_hex: `Q${item}`, weight: ms.weights[index] })
      })
      return output
    }
    return false
  },
  mso(ms) {
    const output = []
    if (ms) {
      _.each(ms.addrs_to, (item, index) => {
        output.push({ address: `Q${item}`, amount: (ms.amounts[index] / SHOR_PER_QUANTA) })
      })
      return output
    }
    return false
  },
  multiSigAddress() {
    const desc = hexToBytes('110000')
    const txhash = hexToBytes(Session.get('txhash').transaction.tx.transaction_hash)
    const arr = desc.concat(txhash)
    const prevHash = hexToBytes(sha256(arr))
    const newArr = desc.concat(prevHash)
    const newHash = hexToBytes(sha256(newArr).slice(56, 64))
    const q1 = desc.concat(prevHash)
    const q = q1.concat(newHash)
    return `Q${toHexString(q)}`
  },
  multiSigSpendAddress() {
    try {
      return `Q${this.tx.multi_sig_spend.multi_sig_address}`
    } catch (error) {
      return null
    }
  },
  bf(b) {
    return Buffer.from(b).toString('hex')
  },
})

Template.tx.events({
  'click .close': () => {
    $('.message').hide()
  },
  'click .jsonclick': () => {
    if (!($('.json').html())) {
      const myJSON = Session.get('txhash').transaction
      const formatter = new JSONFormatter(myJSON)
      $('.json').html(formatter.render())
    }
    $('.jsonbox').toggle()
  },
  'submit #notariseVerificationForm': (event) => {
    event.preventDefault()
    event.stopPropagation()

    $('#documentVerified').hide()
    $('#documentVerifcationFailed').hide()

    const notaryDocuments = $('#notaryDocument').prop('files')
    const notaryDocument = notaryDocuments[0]

    // Get notary details from txn
    const txhash = Session.get('txhash').transaction
    const txnHashFunction = txhash.explorer.hash_function
    const txnFileHash = txhash.explorer.hash
    let txnNotary
    if (Session.equals('addressFormat', 'bech32')) {
      txnNotary = txhash.explorer.from_b32
    } else {
      txnNotary = txhash.explorer.from_hex
    }

    let txnNotaryDate
    if (txhash.header) {
      const x = moment.unix(txhash.header.timestamp_seconds)
      txnNotaryDate = moment(x).format('HH:mm D MMM YYYY')
    } else {
      const x = moment.unix(txhash.timestamp_seconds)
      txnNotaryDate = moment(x).format('HH:mm D MMM YYYY')
    }

    // Verify user supplied file against txn hash
    const reader = new FileReader()
    reader.onloadend = function onloadend() {
      try {
        let fileHash

        // Convert FileReader ArrayBuffer to WordArray first
        const resultWordArray = CryptoJS.lib.WordArray.create(reader.result)

        if (txnHashFunction === 'SHA1') {
          fileHash = CryptoJS.SHA1(resultWordArray).toString(CryptoJS.enc.Hex)
        } else if (txnHashFunction === 'SHA256') {
          fileHash = CryptoJS.SHA256(resultWordArray).toString(CryptoJS.enc.Hex)
        } else if (txnHashFunction === 'MD5') {
          fileHash = CryptoJS.MD5(resultWordArray).toString(CryptoJS.enc.Hex)
        }

        // Verify the txnFileHash is the same as provided file
        if (txnFileHash === fileHash) {
          // Valid document notarisation
          const successMessage = String.raw`The file '${notaryDocument.name}' has been verifiably
          notarised by '${txnNotary}' on ${txnNotaryDate} using the hash function '${txnHashFunction}'
          resulting in the hash '${txnFileHash}'.`

          Session.set('documentNotarisationVerificationMessage', successMessage)
          $('#documentVerified').show()
        } else {
          Session.set('documentNotarisationError', 'The file provided does not match the notary hash in this transaction.')
          $('#documentVerifcationFailed').show()
        }
      } catch (err) {
        console.log(err)
        // Invalid file format
        Session.set('documentNotarisationError', 'Unable to open Document - Are you sure you selected a document to verify?')
        $('#documentVerifcationFailed').show()
      }
    }

    // Verify user selected a document to notarise
    if (notaryDocument === undefined) {
      Session.set('documentNotarisationError', 'Unable to open Document - Are you sure you selected a document to verify?')
      $('#documentVerifcationFailed').show()
    } else {
      console.log('reading file ', notaryDocument)
      reader.readAsArrayBuffer(notaryDocument)
    }
  },
})

Template.tx.onRendered(() => {
  this.$('.value').popup()
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    Session.set('txhash', {})
    Session.set('qrl', 0)
    Session.set('status', {})
    renderTxBlock()
  })
})
