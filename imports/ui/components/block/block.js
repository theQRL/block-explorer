import JSONFormatter from 'json-formatter-js'
import './block.html'

const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

const blockResultsRefactor = (res) => {
  // rewrite all arrays as strings (Q-addresses) or hex (hashes)
  const output = res
  // console.log(res)
  if (res.block.header) {
    output.block.header.hash_header = Buffer.from(output.block.header.hash_header).toString('hex')
    output.block.header.hash_header_prev = Buffer.from(output.block.header.hash_header_prev).toString('hex')
    output.block.header.merkle_root = Buffer.from(output.block.header.merkle_root).toString('hex')
    output.block.header.hash_reveal = Buffer.from(output.block.header.hash_reveal).toString('hex')
    output.block.header.stake_selector = ab2str(output.block.header.stake_selector)

    // transactions
    const transactions = []
    output.block.transactions.forEach((value) => {
      const adjusted = value
      adjusted.addr_from = ab2str(adjusted.addr_from)
      adjusted.public_key = Buffer.from(adjusted.public_key).toString('hex')
      adjusted.transaction_hash = Buffer.from(adjusted.transaction_hash).toString('hex')
      adjusted.signature = Buffer.from(adjusted.signature).toString('hex')
      if (value.transactionType === 'coinbase') {
        adjusted.coinbase.addr_to = ab2str(adjusted.coinbase.addr_to)
      }
      if (value.transactionType === 'transfer') {
        adjusted.transfer.addr_to = ab2str(adjusted.transfer.addr_to)
      }
      transactions.push(adjusted)
    })
    output.block.transactions = transactions

    // votes
    const votes = []
    output.block.vote.forEach((value) => {
      const adjusted = value
      adjusted.addr_from = ab2str(adjusted.addr_from)
      adjusted.public_key = Buffer.from(adjusted.public_key).toString('hex')
      adjusted.transaction_hash = Buffer.from(adjusted.transaction_hash).toString('hex')
      adjusted.signature = Buffer.from(adjusted.signature).toString('hex')
      adjusted.vote.hash_header = Buffer.from(adjusted.vote.hash_header).toString('hex')
      votes.push(adjusted)
    })
    output.block.vote = votes
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
    return rewardBlock * 1.0e-8
  },
  ts() {
    try {
      const x = moment.unix(this.header.timestamp.seconds)
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
      return this.transfer.amount * 1e-8
    }
    return ''
  },
  fee() {
    if (this.transfer) {
      return this.transfer.fee * 1.0e-8
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
