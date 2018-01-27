/* eslint no-console: 0 */
/* ^^^ remove once testing complete
 */
import JSONFormatter from 'json-formatter-js'
import './address.html'
import '../../stylesheets/overrides.css'

const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

const addressResultsRefactor = (res) => {
  // rewrite all arrays as strings (Q-addresses) or hex (hashes)
  const output = res
  if (res.state) {
    // output.state.address = ab2str(output.state.address)
    output.state.txcount = output.state.transaction_hashes.length

    // transactions
    const transactions = []
    output.state.transaction_hashes.forEach((value) => {
      transactions.push({ txhash: Buffer.from(value).toString('hex') })
    })
    output.state.transactions = transactions

    // txhashes
    const transactionHashes = []
    output.state.transaction_hashes.forEach((value) => {
      const adjusted = Buffer.from(value).toString('hex')
      transactionHashes.push(adjusted)
    })
    output.state.transaction_hashes = transactionHashes
  }
  return output
}

const addressTransactionsRefactor = (res) => {
  // rewrite all arrays as strings (Q-addresses) or hex (hashes)
  let output = res
  if (res.length > 0) {
    // transactions
    const transactions = []
    output.forEach((value) => {
      const edit = value
      if (edit.found) {
        edit.transaction.header.hash_header = Buffer.from(edit.transaction.header.hash_header).toString('hex')
        edit.transaction.header.hash_header_prev = Buffer.from(edit.transaction.header.hash_header_prev).toString('hex')
        edit.transaction.header.merkle_root = Buffer.from(edit.transaction.header.merkle_root).toString('hex')
        edit.transaction.tx.addr_from = ab2str(edit.transaction.tx.addr_from)
        edit.transaction.tx.public_key = Buffer.from(edit.transaction.tx.public_key).toString('hex')
        edit.transaction.tx.signature = Buffer.from(edit.transaction.tx.signature).toString('hex')
        edit.transaction.tx.transaction_hash = Buffer.from(edit.transaction.tx.transaction_hash).toString('hex')
        if (edit.transaction.tx.transactionType === 'coinbase') {
          edit.transaction.tx.addr_to = ab2str(edit.transaction.tx.coinbase.addr_to)
          edit.transaction.tx.coinbase.addr_to = ab2str(edit.transaction.tx.coinbase.addr_to)
          edit.transaction.tx.coinbase.amount *= 1e-9
          edit.transaction.tx.amount = edit.transaction.tx.coinbase.amount
        }
        if (edit.transaction.tx.transactionType === 'transfer') {
          edit.transaction.tx.addr_to = ab2str(edit.transaction.tx.transfer.addr_to)
          edit.transaction.tx.transfer.addr_to = ab2str(edit.transaction.tx.transfer.addr_to)
          edit.transaction.tx.transfer.amount *= 1e-9
          edit.transaction.tx.amount = edit.transaction.tx.transfer.amount
          edit.transaction.tx.transfer.fee *= 1e-9
        }
      }
      transactions.push(edit)
    })
    output = transactions
  }
  return output
}

const getTxArray = (txArray) => {
  Meteor.call('addressTransactions', txArray, (errTx, resTx) => {
    if (errTx) {
      Session.set('addressTransactions', { error: errTx })
    } else {
      Session.set('addressTransactions', addressTransactionsRefactor(resTx))
      $('.loader').hide()
      Session.set('fetchedTx', true)
    }
  })
}

const renderAddressBlock = () => {
  const aId = FlowRouter.getParam('aId')
  if (aId) {
    const req = {
      address: Buffer.from(aId, 'ascii'),
    }
    Meteor.call('getAddressState', req, (err, res) => {
      if (err) {
        Session.set('address', { error: err, id: aId })
      } else {
        if (res) {
          res.state.address = ab2str(res.state.address)
          res.state.balance *= 1e-9
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
        const numPages = Math.ceil(res.state.transactions.length / 10)
        const pages = []
        while (pages.length !== numPages) {
          pages.push({
            number: pages.length + 1,
            from: ((pages.length + 1) * 10) + 1,
            to: ((pages.length + 1) * 10) + 10,
          })
        }
        Session.set('pages', pages)
        let txArray = res.state.transactions.reverse()
        if (txArray.length > 10) {
          txArray = txArray.slice(0, 9)
        }
        getTxArray(txArray)
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
  address() {
    return Session.get('address')
  },
  pages() {
    let ret = []
    const active = Session.get('active')
    if (Session.get('pages').length > 0) {
      ret = Session.get('pages')
      if ((active - 5) <= 0) {
        ret = ret.slice(0, 9)
      } else {
        if ((active + 10) > ret.length) {
          ret = ret.slice(ret.length - 10, ret.length)
        } else {
          ret = ret.slice(active - 5, active + 4)
        }
      }
    }
    return ret
  },
  addressTx() {
    let ret = []
    if (Session.get('addressTransactions').length > 0) {
      ret = Session.get('addressTransactions')
    }
    return ret
  },
  QRtext() {
    return FlowRouter.getParam('aId')
  },
  ts() {
    let x = ''
    if (Session.get('addressTransactions').length > 0) {
      if (this.found) {
        if (moment.unix(this.transaction.header.timestamp.seconds).isValid()) {
          x = moment.unix(this.transaction.header.timestamp.seconds)
        }
      } else {
        x = 'Unconfirmed Tx'
      }
    }
    return x
  },
  qrl() {
    const address = Session.get('address')
    try {
      const value = address.state.balance
      const x = Session.get('qrl')
      return Math.round((x * value) * 100) / 100
    } catch (e) {
      return 0
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
    if (this.number === Session.get('active')) {
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
    if (Session.get('pages').length > 1) {
      ret = true
    }
    return ret
  },
})

Template.address.events({
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
      const c = Session.get('pages')
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
    const startIndex = (b - 1) * 10
    console.log(`active page: ${b}`)
    Session.set('active', b)
    const txArray = Session.get('address').state.transactions.reverse().slice(startIndex, startIndex + 10)
    console.log(txArray)
    $('.loader').show()
    Session.set('fetchedTx', false)
    getTxArray(txArray)
  },
})

Template.address.onRendered(() => {
  this.$('.value').popup()
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    Session.set('address', {})
    Session.set('addressTransactions', {})
    Session.set('qrl', 0)
    Session.set('pages', [])
    Session.set('active', 1)
    Session.set('fetchedTx', false)
    renderAddressBlock()
  })
})
