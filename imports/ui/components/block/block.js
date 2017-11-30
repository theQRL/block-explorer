import JSONFormatter from 'json-formatter-js'
import './block.html'

Template.block.onCreated(() => {
  Session.set('block', {})
  const blockId = parseInt(FlowRouter.getParam('blockId'), 10)
  if (blockId) {
    Meteor.call('block', blockId, (err, res) => {
      // The method call sets the Session variable to the callback value
      if (err) {
        Session.set('block', {
          error: err,
          id: blockId
        })
      } else {
        Session.set('block', res)
      }
    })
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
    reward_block = Session.get('block').block.header.reward_block
    return reward_block * 1.0e-8
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
      return Buffer.from(this.coinbase.addr_to)
    }
    if (this.transactionType === 'transfer') {
      return Buffer.from(this.transfer.addr_to)
    }
    return ''
  },
  transaction_hash_hex() {
    return Buffer.from(this.transaction_hash).toString('hex')
  },
  amount() {
    if (this.transfer)
    {
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
  public_key_hex() {
    return Buffer.from(this.public_key).toString('hex')
  },  json() {
    const myJSON = this
    const formatter = new JSONFormatter(myJSON)
    $('.json')
      .append(formatter.render())
  },
})

Template.block.events({
  'click .close': () => {
    $('.message')
      .hide()
  },
  'click .jsonclick': () => {
    $('.jsonbox')
      .toggle()
  },
})

Template.block.onRendered(() => {
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    const blockId = parseInt(FlowRouter.getParam('blockId'), 10)
    Meteor.call('block', blockId, (err, res) => {
      if (err) {
        Session.set('block', { error: err })
      } else {
        Session.set('block', res)
      }
    })
  })
})
