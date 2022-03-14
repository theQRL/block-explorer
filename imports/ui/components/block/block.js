import JSONFormatter from 'json-formatter-js'
import './block.html'
import {
  numberToString, SHOR_PER_QUANTA, formatBytes, hexOrB32,
} from '../../../startup/both/index.js'

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

Template.block.helpers({
  block() {
    try {
      return Session.get('block').block
    } catch (e) {
      return false
    }
  },
  blockSize() {
    try {
      const bytes = Session.get('block').block.size
      return formatBytes(bytes)
    } catch (e) {
      return false
    }
  },
  header() {
    try {
      return Session.get('block').block.header
    } catch (e) {
      return false
    }
  },
  transactions() {
    try {
      return Session.get('block').block.transactions
    } catch (e) {
      return false
    }
  },
  block_reward() {
    try {
      const rewardBlock = Session.get('block').block.header.reward_block
      return numberToString(parseInt(rewardBlock, 10) / SHOR_PER_QUANTA)
    } catch (e) {
      return false
    }
  },
  block_epoch() {
    try {
      return calculateEpoch(Session.get('block').block.header.block_number)
    } catch (e) {
      return false
    }
  },
  mining_nonce() {
    try {
      return Session.get('block').block.header.mining_nonce
    } catch (e) {
      return false
    }
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
  render_addr_from() {
    return hexOrB32(this.addr_from)
  },
  render_addr_to() {
    if (this.transactionType === 'coinbase') {
      return hexOrB32(this.coinbase.addr_to)
    }
    if (this.transactionType === 'transfer') {
      if (this.transfer.totalOutputs === 1) {
        return hexOrB32(this.transfer.addrs_to[0])
      }
      return `${this.transfer.totalOutputs} addresses`
    }
    if (this.transactionType === 'transfer_token') {
      if (this.transfer_token.totalOutputs === 1) {
        return hexOrB32(this.transfer_token.addrs_to[0])
      }
      return `${this.transfer_token.totalOutputs} addresses`
    }
    return ''
  },
  isCreateNFT() {
    console.log(this)
    try {
      if (this.nft.type === 'CREATE NFT') {
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },
  amount() {
    if (this.transactionType === 'transfer') {
      return `${numberToString(this.transfer.totalTransferred)} Quanta`
    }
    if (this.transactionType === 'transfer_token') {
      return `${numberToString(this.transfer_token.totalTransferred)} ${this.transfer_token.tokenSymbol}`
    }
    if (this.transactionType === 'coinbase') {
      return `${numberToString(this.coinbase.amount / SHOR_PER_QUANTA)} Quanta`
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
    if (txType === 'transfer') {
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
  singleOutput(outputs) {
    if (outputs === 1) {
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

Template.block.onCreated(() => {
  Session.set('block', {})
  Session.set('activeBlock', '')
  const blockId = parseInt(FlowRouter.getParam('blockId'), 10)
  if (blockId || blockId === 0) {
    Session.set('activeBlock', blockId)
    renderBlockBlock(blockId)
  } else {
    // console.log('bad block in route')
    FlowRouter.go('/404')
  }
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    const bId = parseInt(FlowRouter.getParam('blockId'), 10)
    // console.log(`Tracked: ${bId} and activeBlock: ${Session.get('activeBlock')}`)
    if (!Number.isNaN(bId)) {
      if (parseInt(Session.get('activeBlock'), 10) !== bId) {
        // console.log('rendering...')
        renderBlockBlock(bId)
      }
    }
    // else {
    // console.log('ignoring NaN')
    // }
  })
})
