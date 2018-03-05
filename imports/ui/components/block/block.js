import JSONFormatter from 'json-formatter-js'
import './block.html'

const calculateEpoch = (blockNumber) => {
  const blocksPerEpoch = 100
  return Math.floor(blockNumber / blocksPerEpoch)
}

const blockResultsRefactor = (res) => {
  // rewrite all arrays as strings (Q-addresses) or hex (hashes)
  const output = res
  // console.log(res)
  if (res.block.header) {
    output.block.header.hash_header = Buffer.from(output.block.header.hash_header).toString('hex')
    output.block.header.hash_header_prev = Buffer.from(output.block.header.hash_header_prev).toString('hex')
    output.block.header.merkle_root = Buffer.from(output.block.header.merkle_root).toString('hex')
    // output.block.header.mining_nonce = output.block.header.mining_nonce
    output.block.header.PK = Buffer.from(output.block.header.PK).toString('hex')

    // transactions
    const transactions = []
    output.block.transactions.forEach((value) => {
      const adjusted = value
      adjusted.addr_from = 'Q' + Buffer.from(adjusted.addr_from).toString('hex')
      adjusted.public_key = Buffer.from(adjusted.public_key).toString('hex')
      adjusted.transaction_hash = Buffer.from(adjusted.transaction_hash).toString('hex')
      adjusted.signature = Buffer.from(adjusted.signature).toString('hex')
      if (value.transactionType === 'coinbase') {
        adjusted.coinbase.addr_to = 'Q' + Buffer.from(adjusted.coinbase.addr_to).toString('hex')
        adjusted.coinbase.headerhash = Buffer.from(adjusted.coinbase.headerhash).toString('hex')
        // FIXME: need to refactor to explorer.[GUI] format (below allow amount to be displayed)
        adjusted.transfer = adjusted.coinbase
      }
      if (value.transactionType === 'transfer') {
        adjusted.transfer.addr_to = 'Q' + Buffer.from(adjusted.transfer.addr_to).toString('hex')
      }
      transactions.push(adjusted)
    })
    output.block.transactions = transactions
  }
  return output
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
      if (res.found) { Session.set('block', blockResultsRefactor(res)) }
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
    return (parseInt(rewardBlock, 10)  / SHOR_PER_QUANTA).toFixed(9)
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
      return this.transfer.addr_to
    }
    return ''
  },
  amount() {
    if (this.transfer) {
      return (this.transfer.amount / SHOR_PER_QUANTA).toFixed(9)
    }
    return ''
  },
  fee() {
    if (this.transfer) {
      return this.fee
    }
    return ''
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
