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
      // console.log(res)
      if (res.found) { Session.set('block', res) }
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
      const x = moment.unix(this.header.timestamp_seconds)
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
      return this.transfer.totalOutputs + " outputs"
    }
    if (this.transactionType === 'transfer_token') {
      return this.transfer_token.totalOutputs + " outputs"
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
