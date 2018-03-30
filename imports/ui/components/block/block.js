import JSONFormatter from 'json-formatter-js'
import './block.html'

const calculateEpoch = (blockNumber) => {
  const blocksPerEpoch = 100
  return Math.floor(blockNumber / blocksPerEpoch)
}

const renderBlockBlock = (blockId) => {
  Meteor.call('block', blockId, (err, res) => {
    // The method call sets the Session variable to the callback value
    if (err) {
      Session.set('block', {
        error: err,
        id: blockId,
      })
    } else {
      if (res.found) { Session.set('block', res) }
      $('#loadingTransactions').hide()
    }
  })
}

Template.block.onCreated(() => {
  Session.set('block', {})
  const blockId = parseInt(FlowRouter.getParam('blockId'), 10)
  if (blockId) {
    renderBlockBlock(blockId)
  }
})

Template.block.helpers({
  block() {
    return Session.get('block').block
  },
  blockSize() {
    const bytes = Session.get('block').block.size
    return formatBytes(bytes)
  },
  header() {
    return Session.get('block').block.header
  },
  transactions() {
    return Session.get('block').block.transactions
  },
  block_reward() {
    const rewardBlock = Session.get('block').block.header.reward_block
    return numberToString(parseInt(rewardBlock, 10)  / SHOR_PER_QUANTA)
  },
  block_epoch() {
    return calculateEpoch(Session.get('block').block.header.block_number)
  },
  mining_nonce() {
    return Session.get('block').block.header.mining_nonce
  },
  ts() {
    try {
      const thisHeader = Session.get('block').block.header
      const x = moment.unix(thisHeader.timestamp_seconds)
      return moment(x).format('HH:mm D MMM YYYY')
    } catch (e) {
      return ' '
    }
  },
  color() {
    if (this.transactionType === 'coinbase') {
      return 'teal'
    }
    if (this.transactionType === 'stake') {
      return 'red'
    }
    if (this.transactionType === 'transfer') {
      return 'yellow'
    }
    return ''
  },
  addr_from_hex() {
    return Buffer.from(this.addr_from)
  },
  addr_to_hex() {
    if (this.transactionType === 'coinbase') {
      return this.coinbase.addr_to
    }
    if (this.transactionType === 'transfer') {
      if(this.transfer.totalOutputs == 1) {
        return this.transfer.addrs_to[0]
      } else {
        return this.transfer.totalOutputs + " addresses"
      }
    }
    if (this.transactionType === 'transfer_token') {
      if(this.transfer_token.totalOutputs == 1) {
        return this.transfer_token.addrs_to[0]
      } else {
        return this.transfer_token.totalOutputs + " addresses"
      }
    }
    return ''
  },
  amount() {
    if (this.transactionType === 'transfer') {
      return numberToString(this.transfer.totalTransferred) + " Quanta"
    }
    if (this.transactionType === 'transfer_token') {
      return numberToString(this.transfer_token.totalTransferred) + " " + this.transfer_token.tokenSymbol
    }
    if (this.transactionType === 'coinbase') {
      return numberToString(this.coinbase.amount / SHOR_PER_QUANTA) + " Quanta"
    }
    return ''
  },
  fee() {
    if (this.transfer) {
      return this.fee
    }
    if (this.token) {
      return this.fee
    }
    return ''
  },
  isTransfer(txType) {
    if(txType == "transfer") {
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
  singleOutput(outputs) {
    if(outputs == 1) {
      return true
    }
    return false
  }
})

Template.block.events({
  'click .close': () => {
    $('.message')
      .hide()
  },
  'click .jsonclick': () => {
    if (!($('.json').html())) {
      const myJSON = Session.get('block').block
      const formatter = new JSONFormatter(myJSON)
      $('.json').html(formatter.render())
    }
    $('.jsonbox').toggle()
  },
})

Template.block.onRendered(() => {
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    const blockId = parseInt(FlowRouter.getParam('blockId'), 10)
    renderBlockBlock(blockId)
  })
})
