/* eslint no-console: 0 */
/* ^^^ remove once testing complete
 */
import JSONFormatter from 'json-formatter-js'
import qrlAddressValdidator from '@theqrl/validate-qrl-address'
import { rawAddressToB32Address, rawAddressToHexAddress } from '@theqrl/explorer-helpers'
import './address.html'
import {
  bytesToString, anyAddressToRaw, hexOrB32, numberToString, SHOR_PER_QUANTA, upperCaseFirst
} from '../../../startup/both/index.js'


let tokensHeld = []

// const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

const addressResultsRefactor = (res) => {
  // rewrite all arrays as strings (Q-addresses) or hex (hashes)
  const output = res
  /*
  if (res.state) {
    // output.state.address = ab2str(output.state.address)
    output.state.txcount = output.state.transaction_hashes.length

    // transactions
    const transactions = []
    output.state.transaction_hashes.forEach((value) => {
      transactions.push({ txhash: Buffer.from(value).toString('hex') })
    })
    output.state.transactions = transactions

    // pubhashes
    const pubhashes = []
    if (output.state.pubhashes) {
      output.state.pubhashes.forEach((value) => {
        const adjusted = Buffer.from(value).toString('hex')
        pubhashes.push(adjusted)
      })
      output.state.pubhashes = pubhashes
    }

    // txhashes
    const transactionHashes = []
    output.state.transaction_hashes.forEach((value) => {
      const adjusted = Buffer.from(value).toString('hex')
      transactionHashes.push(adjusted)
    })
    output.state.transaction_hashes = transactionHashes
  }
  */
  return output
}

async function parseOTS(obj) {
  const k = Object.keys(obj)
  let c = 0
  let ret = ''
  // k.forEach((val) => {
  //   let o = '<div class="column '
  //   if (obj[val] === 1) {
  //     o = `${o}used`
  //   } else {
  //     o = `${o}unused`
  //   }
  //   o = `${o}">${val}</div>`
  //   c += 1
  //   if (c > 10) {
  //     ret = `${ret}</div><div class="row">`
  //     c -= 10
  //   }
  //   ret = `${ret}${o}`
  // })
  // console.log(c)
  // if (c < 10) {
  //   // add some empty columns
  //   for (let i = c; i < 10; i += 1) {
  //     ret = `${ret}<div class="column"></div>`
  //   }
  // }
  return ret
}

async function OTS(obj) {
  const x = await parseOTS(obj)
  Session.set('OTStracker', `<div class="row">${x}</div>`)
}

function loadAddressTransactions(aId, page) {
  Session.set('addressTransactions', [])
  $('#loadingTransactions').show()
  console.log('Getting transactions for page ', page)
  const addresstx = anyAddressToRaw(aId)
  request = {
    address: addresstx,
    item_per_page: 10,
    page_number: page,
  }

  Meteor.call('getTransactionsByAddress', request, (err, res) => {
    if (err) {
      Session.set('addressTransactions', { error: err })
    } else {
      Session.set('addressTransactions', res.transactions_detail)
      const a = Session.get('address')
      a.transactions = res.transactions_detail
      Session.set('address', a)
      Session.set('fetchedTx', true)
    }

    $('#loadingTransactions').hide()
    $('#noTransactionsFound').show()
  })
}


const getTokenBalances = (getAddress, callback) => {
  const request = {
    address: anyAddressToRaw(getAddress),
  }

  /*
  Meteor.call('getAddressState', request, (err, res) => {
    if (err) {
      // TODO - Error handling
    } else {
      // first generate OTS tracker HTML
      OTS(res.ots.keys)
      // Now for each res.state.token we find, go discover token name and symbol
      // eslint-disable-next-line
      if (res.state.address !== '') {
        Object.keys(res.state.tokens).forEach((key) => {
          const tokenHash = key
          const tokenBalance = res.state.tokens[key]

          const thisToken = {}

          const req = {
            query: Buffer.from(tokenHash, 'hex'),
          }

          Meteor.call('getObject', req, (objErr, objRes) => {
            if (err) {
              // TODO - Error handling here
              console.log('err:', objErr)
            } else {
              // Check if this is a token hash.
              // eslint-disable-next-line
              if (objRes.transaction.tx.transactionType !== "token") {
                // TODO - Error handling here
              } else {
                const tokenDetails = objRes.transaction.tx.token

                thisToken.hash = tokenHash
                thisToken.name = bytesToString(tokenDetails.name)
                thisToken.symbol = bytesToString(tokenDetails.symbol) // eslint-disable-next-line
                thisToken.balance = tokenBalance / Math.pow(10, tokenDetails.decimals)

                tokensHeld.push(thisToken)

                Session.set('tokensHeld', tokensHeld)
              }
            }
          })
        })

        callback()

        // When done hide loading section
        $('#loading').hide()
      } else {
        // Wallet not found, put together an empty response
        callback()
      }
    }
  })
  */
}


const renderAddressBlock = () => {
  const aId = upperCaseFirst(FlowRouter.getParam('aId'))
  let tPage = FlowRouter.getParam('tPage')
  tPage = parseInt(tPage, 10)
  if (!tPage) { tPage = 1 }
  // TODO: validate aId before constructing Method call
  if (aId) {
    const req = {
      address: anyAddressToRaw(aId),
    }
    Meteor.call('getAddressState', req, (err, res) => {
      if (err) {
        Session.set('address', { error: err, id: aId })
      } else {
        if (res) {
          res.state.balance = (parseInt(res.state.balance, 10) / SHOR_PER_QUANTA).toFixed(9)
          if (!(res.state.address)) {
            res.state.address = aId
          }
          if (parseInt(res.state.txcount, 10) === 0 && parseInt(res.state.nonce, 10) === 0) {
            res.state.empty_warning = true
          } else {
            res.state.empty_warning = false
          }
        }
        Session.set('address', addressResultsRefactor(res))
        Session.set('fetchedTx', false)
        const numPages = Math.ceil(res.state.transaction_hash_count / 10)
        const pages = []
        while (pages.length !== numPages) {
          pages.push({
            number: pages.length + 1,
            from: ((pages.length + 1) * 10) + 1,
            to: ((pages.length + 1) * 10) + 10,
          })
        }
        // let txArray = null
        Session.set('pages', pages)
        Session.set('active', tPage)
        const startIndex = (tPage - 1) * 10
        // txArray = res.state.transactions.reverse().slice(startIndex, startIndex + 10)
        Session.set('fetchedTx', false)
        loadAddressTransactions(aId, tPage)
      }
    })
  }
  Meteor.call('QRLvalue', (err, res) => {
    if (err) {
      Session.set('qrl', 'Error getting value from API')
    } else {
      Session.set('qrl', res)
    }
  })
}

Template.address.helpers({
  bech32() {
    return Session.equals('addressFormat', 'bech32')
  },
  address() {
    const address = Session.get('address')
    if (address !== undefined) {
      if (address.state !== undefined) {
        address.state.address = hexOrB32(anyAddressToRaw(address.state.address))
        return address
      }
    }
    // error handling needed here
    return false
  },
  pages() {
    let ret = []
    const active = Session.get('active')
    if (Session.get('pages').length > 0) {
      ret = Session.get('pages')
      if ((active - 5) <= 0) {
        ret = ret.slice(0, 9)
      } else {
        // eslint-disable-next-line
        if ((active + 10) > ret.length) {
          ret = ret.slice(ret.length - 10, ret.length)
        } else {
          ret = ret.slice(active - 5, active + 4)
        }
      }
    }
    return ret
  },
  coinbaseValue() {
    return this.coinbase.amount / SHOR_PER_QUANTA
  },
  // timestampToDateTime(ts) {
  //   console.log('ts', ts)
  //   if (moment.unix(ts.timestamp).isValid()) {
  //     return moment.unix(ts.timestamp).format('HH:mm D MMM YYYY')
  //   }
  //   return 'Unconfirmed Tx'
  // },
  addressTx() {
    let ret = []
    if (Session.get('addressTransactions').length > 0) {
      ret = Session.get('addressTransactions')
    }
    return ret
  },
  addressTransactions() {
    try {
      const transactions = []
      const thisAddress = rawAddressToB32Address(Session.get('address').state.address)
      _.each(Session.get('addressTransactions'), (transaction) => {
        // Store modified transaction
        const y = transaction.tx

        // Update timestamp from unix epoch to human readable time/date.
        if (moment.unix(transaction.timestamp).isValid()) {
          y.timestamp = moment.unix(transaction.timestamp).format('HH:mm D MMM YYYY')
        } else {
          y.timestamp = 'Unconfirmed Tx'
        }

        y.addr_from = transaction.addr_from

        // Set total received amount if sent to this address
        let thisReceivedAmount = 0
        if ((transaction.type === 'transfer') || (transaction.type === 'transfer_token')) {
          _.each(transaction.outputs, (output) => {
            if (output.address_b32 === thisAddress) {
              thisReceivedAmount += parseFloat(output.amount)
            }
          })
        }
        y.thisReceivedAmount = numberToString(thisReceivedAmount)

        transactions.push(y)
      })
      console.log('transactions', transactions)
      return transactions
    } catch (e) {
      return false
    }
  },
  receivedAmount(tx) {
    const a = Session.get('address').state.address
    const outputs = tx.transfer
    if (outputs) {
      let amount = 0
      _.each(outputs.addrs_to, (element, key) => {
        if (element === a) {
          amount += (outputs.amounts[key] / SHOR_PER_QUANTA)
        }
      })
      return amount
    }
    return ''
  },
  sendingOutputs(outputs) {
    console.log('outputs', outputs)
    const result = []
    _.each(outputs.transfer.addrs_to, (element, key) => {
      console.log('made it here')
      result.push({ to: element, amount: (outputs.transfer.amounts[key] / SHOR_PER_QUANTA) })
    })
    console.log('return in sendingOutputs', result)
    return result
  },
  totalTransferred(tx) {
    const outputs = tx.transfer
    if (outputs) {
      let amount = 0
      _.each(outputs.amounts, (element) => {
        amount += element / SHOR_PER_QUANTA
      })
      return amount
    }
    return ''
  },
  addressHasTransactions() {
    try {
      if (Session.get('addressTransactions').length > 0) {
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },
  isThisAddress(address) {
    try {
      console.log(address)
      if (address === Session.get('address').state.address) {
        console.log('isThisAddress ping true on ', address)
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },
  getAmount(index) {
    return this.amounts[index]
  },
  QRtext() {
    return upperCaseFirst(FlowRouter.getParam('aId'))
  },
  qrl() {
    const address = Session.get('address')
    try {
      const value = address.state.balance
      const x = Session.get('qrl')
      return Math.round((x * value) * 100) / 100
    } catch (e) {
      return '...'
    }
  },
  color() {
    let ret = ''
    if (this.found) {
      if (this.transaction.tx.transactionType === 'coinbase') {
        ret = 'teal'
      }
      if (this.transaction.tx.transactionType === 'stake') {
        ret = 'red'
      }
      if (this.transaction.tx.transactionType === 'transfer') {
        ret = 'yellow'
      }
    }
    return ret
  },
  isActive() {
    let ret = ''
    const tPage = parseInt(FlowRouter.getParam('tPage'), 10)
    if ((this.number === Session.get('active')) || (tPage === this.number)) {
      ret = 'active'
    }
    return ret
  },
  pback() {
    let ret = false
    if (Session.get('active') !== 1) {
      ret = true
    }
    return ret
  },
  pforward() {
    let ret = false
    if (Session.get('active') !== Session.get('pages').length) {
      ret = true
    }
    return ret
  },
  pagination() {
    let ret = false
    if (Session.get('pages')) {
      if (Session.get('pages').length > 1) {
        ret = true
      }
    }
    return ret
  },
  currentPage() {
    return Session.get('active')
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
  isLatticePKTxn(txType) {
    if (txType === 'latticePK') {
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
  isKeybaseTxn(txType) {
    if (txType === 'KEYBASE') {
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
  tokensHeld() {
    return Session.get('tokensHeld')
  },
  addressValidation() {
    try {
      const thisAddress = rawAddressToHexAddress(anyAddressToRaw(Session.get('address').state.address))
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
      const { keysConsumed } = Session.get('address').ots
      const validationResult = qrlAddressValdidator.hexString(thisAddress)
      const result = {}
      result.height = validationResult.sig.height
      result.totalSignatures = validationResult.sig.number
      result.keysRemaining = result.totalSignatures - keysConsumed
      result.signatureScheme = validationResult.sig.type
      result.hashFunction = validationResult.hash.function
      return result
    } catch (e) {
      return false
    }
  },
  totalPages() {
    if (Session.get('pages')) {
      return Session.get('pages').length
    }
    return false
  },
  OTStracker() {
    return Session.get('OTStracker')
  },
})

Template.address.events({
  'keypress #paginator': (event) => {
    if (event.keyCode === 13) {
      const x = parseInt($('#paginator').val(), 10)
      const max = Session.get('pages').length
      if ((x < (max + 1)) && (x > 0)) {
        FlowRouter.go(`/a/${upperCaseFirst(FlowRouter.getParam('aId'))}/${x}`)
      }
    }
  },
  'click .refresh': () => {
    Session.set('address', {})
    renderAddressBlock()
  },
  'click .close': () => {
    $('.message').hide()
  },
  'click .jsonclick': () => {
    if (!($('.json').html())) {
      const myJSON = Session.get('address')
      const formatter = new JSONFormatter(myJSON)
      $('.json').html(formatter.render())
    }
    $('.jsonbox').toggle()
  },
  'click .pagination': (event) => {
    let b = 0
    Session.set('addressTransactions', {})
    if (parseInt(event.target.text, 10)) {
      b = parseInt(event.target.text, 10)
      Session.set('active', b)
    } else {
      const a = event.target.getAttribute('qrl-data')
      b = Session.get('active')
      const c = Session.get('pages').length
      if (a === 'forward') {
        b += 1
      }
      if (a === 'back') {
        b -= 1
      }
      if (b > c) {
        b = c
      }
      if (b < 1) {
        b = 1
      }
    }
    // const startIndex = (b - 1) * 10
    Session.set('active', b)
    Session.set('fetchedTx', false)
    $('.loader').show()
    $('#loadingTransactions').show()
    FlowRouter.go(`/a/${FlowRouter.getParam('aId')}/${b}`)
  },
  'click #clickHelp': () => {
    window.open('https://docs.theqrl.org', '_blank')
  },
  'click .transactionRecord': (event) => {
    let route = ''
    route = event.currentTarget.attributes[0].ownerElement.childNodes[5].children[0].attributes[0].nodeValue
    if (route.length !== 68) {
      route = event.currentTarget.lastElementChild.children[0].attributes[0].nodeValue
    }
    FlowRouter.go(route)
  },
})

Template.address.onRendered(() => {
  this.$('.value').popup()
  $('#addressTabs .item').tab()
  $('#clickHelp')
    .popup({
      on: 'hover',
    })
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    Session.set('address', {})
    Session.set('addressTransactions', {})
    Session.set('qrl', 0)
    Session.set('pages', [])
    Session.set('active', 1)
    Session.set('fetchedTx', false)
    if (FlowRouter.getParam('aId')) {
      renderAddressBlock()
    }
  })

  Tracker.autorun(() => {
    if (Session.equals('addressFormat', 'bech32') || Session.equals('addressFormat', 'hex')) {
      addressToRender = hexOrB32(Session.get('address').state.address)

      // Re-render identicon
      jdenticon.update('#identicon', addressToRender)
      // Re-render QR Code
      $('.qr-code-container').empty()
      // $('.qr-code-container').qrcode({ width: 100, height: 100, text: addressToRender })
    }
  })

  tokensHeld = []
  Session.set('tokensHeld', [])

  // Get Tokens and Balances
  getTokenBalances(upperCaseFirst(FlowRouter.getParam('aId')), () => {
    $('#tokenBalancesLoading').hide()
  })

  // Render identicon (needs to be here for initial load).
  // Also Session.get('address') is blank at this point
  $('.qr-code-container').qrcode({ width: 100, height: 100, text: upperCaseFirst(FlowRouter.getParam('aId')) })
  jdenticon.update('#identicon', upperCaseFirst(FlowRouter.getParam('aId'))) /* eslint no-undef:0 */
})
