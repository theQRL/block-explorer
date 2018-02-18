/* eslint no-console: 0 */
/* ^^^ remove once testing complete
 */
import JSONFormatter from 'json-formatter-js'
import './tx.html'
import '../../stylesheets/overrides.css'

const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

const txResultsRefactor = (res) => {
  // rewrite all arrays as strings (Q-addresses) or hex (hashes)
  const output = res
  // console.log(res)
  if (res.transaction.header) {
    output.transaction.header.hash_header = Buffer.from(output.transaction.header.hash_header).toString('hex')
    output.transaction.header.hash_header_prev = Buffer.from(output.transaction.header.hash_header_prev).toString('hex')
    output.transaction.header.merkle_root = Buffer.from(output.transaction.header.merkle_root).toString('hex')

    output.transaction.header.stake_selector = ab2str(output.transaction.header.stake_selector)

    output.transaction.tx.transaction_hash = Buffer.from(output.transaction.tx.transaction_hash).toString('hex')
    // output.transaction.tx.addr_to = ''
    output.transaction.tx.amount = ''

    if (output.transaction.tx.transactionType === 'coinbase') {
      output.transaction.tx.addr_to = ab2str(output.transaction.tx.coinbase.addr_to)
      output.transaction.tx.coinbase.addr_to = ab2str(output.transaction.tx.coinbase.addr_to)
      output.transaction.tx.amount = output.transaction.tx.coinbase.amount * 1e-9
      output.transaction.explorer = {
        from: '',
        to: output.transaction.tx.addr_to,
        type: 'TRANSFER',
      }
    }

    if (output.transaction.tx.transactionType === 'transfer') {
      output.transaction.tx.addr_from = ab2str(output.transaction.tx.addr_from)
      output.transaction.tx.addr_to = ab2str(output.transaction.tx.transfer.addr_to)
      output.transaction.tx.transfer.addr_to = ab2str(output.transaction.tx.transfer.addr_to)
      output.transaction.tx.amount = output.transaction.tx.transfer.amount * 1e-9
      output.transaction.tx.fee = output.transaction.tx.fee * 1e-9
      output.transaction.tx.public_key = Buffer.from(output.transaction.tx.public_key).toString('hex')
      output.transaction.tx.signature = Buffer.from(output.transaction.tx.signature).toString('hex')
      output.transaction.explorer = {
        from: output.transaction.tx.addr_from,
        to: output.transaction.tx.addr_to,
        type: 'TRANSFER',
      }
    }
  }

  if (output.transaction.tx.transactionType === 'token') {
    const balances = []
    output.transaction.tx.token.initial_balances.forEach((value) => {
      const edit = value
      edit.address = ab2str(edit.address)
      edit.amount = edit.amount * 1e-9
      balances.push(edit)
    })
    output.transaction.tx.fee = output.transaction.tx.fee * 1e-9
    output.transaction.explorer = {
      from: ab2str(output.transaction.tx.addr_from),
      to: ab2str(output.transaction.tx.addr_from),
      signature: Buffer.from(output.transaction.tx.signature).toString('hex'),
      publicKey: Buffer.from(output.transaction.tx.public_key).toString('hex'),
      symbol: ab2str(output.transaction.tx.token.symbol),
      name: ab2str(output.transaction.tx.token.name),
      owner: ab2str(output.transaction.tx.token.owner),
      initialBalances: balances,
      type: 'CREATE TOKEN',
    }
  }
  if (output.transaction.tx.transactionType === 'transfer_token') {
    output.transaction.tx.fee = output.transaction.tx.fee * 1e-9
    output.transaction.explorer = {
      from: ab2str(output.transaction.tx.addr_from),
      to: ab2str(output.transaction.tx.transfer_token.addr_to),
      signature: Buffer.from(output.transaction.tx.signature).toString('hex'),
      publicKey: Buffer.from(output.transaction.tx.public_key).toString('hex'),
      token_txhash: Buffer.from(output.transaction.tx.transfer_token.token_txhash).toString('hex'),
      amount: output.transaction.tx.transfer_token.amount * 1e-9,
      type: 'TRANSFER TOKEN',
    }
  }
  if (output.transaction.tx.transactionType === 'slave') {
    output.transaction.tx.fee = output.transaction.tx.fee * 1e-9
    output.transaction.explorer = {
      from: ab2str(output.transaction.tx.addr_from),
      to: '',
      signature: Buffer.from(output.transaction.tx.signature).toString('hex'),
      publicKey: Buffer.from(output.transaction.tx.public_key).toString('hex'),
      amount: output.transaction.tx.amount,
      type: 'SLAVE',
    }
  }
  return output
}

const renderTxBlock = () => {
  const txId = FlowRouter.getParam('txId')
  if (txId) {
    Meteor.call('txhash', txId, (err, res) => {
      if (err) {
        Session.set('txhash', { error: err, id: txId })
      } else {
        Session.set('txhash', txResultsRefactor(res))
      }
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

Template.tx.onCreated(() => {
  Session.set('txhash', {})
  Session.set('qrl', 0)
  Session.set('status', {})
  renderTxBlock()
})

Template.tx.helpers({
  tx() {
    // console.log(Session.get('txhash'))
    if (Session.get('txhash').found === true) {
      return Session.get('txhash').transaction
    }
    if (Session.get('txhash').found === false) {
      return { notFound: true, parameter: FlowRouter.getParam('txId') }
    }
    return ''
  },
  notFound() {
    if (Session.get('txhash').found === false) {
      return true
    }
    return false
  },
  header() {
    return Session.get('txhash').transaction.header
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
      // FIXME: We need a unified way to format Quantas
      return (this.tx.coinbase.amount * 1e-9).toFixed(9)
    }
    if (this.tx.transfer) {
      // FIXME: We need a unified way to format Quantas
      // return (this.tx.transfer.amount * 1e-9).toFixed(9)
      return (this.tx.transfer.amount * 1e-9).toFixed(9)
    }
    return ''
  },
  confirmations() {
    const x = Session.get('status')
    try {
      return x.node_info.block_height - this.header.block_number
    } catch (e) {
      return 0
    }
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
  isToken() {
    if (this.explorer.type === 'CREATE TOKEN') {
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
})

Template.tx.onRendered(() => {
  this.$('.value').popup()
})
