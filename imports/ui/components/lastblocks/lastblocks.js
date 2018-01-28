import { Blocks } from '/imports/api/index.js'
import './lastblocks.html'

const addHex = (b) => {
  const result = b
  result.header.hash_header_hex = Buffer.from(result.header.hash_header).toString('hex')
  return result
}

const sumValues = obj => Object.values(obj).reduce((a, b) => a + b)

Template.lastblocks.onCreated(() => {
  Session.set('lastblocks', {})
  Meteor.subscribe('blocks')
})

Template.lastblocks.helpers({
  lastblocks() {
    const res = Blocks.findOne()
    if (res) {
      res.blockheaders = res.blockheaders.reverse()
      const editedBlockheaders = []
      res.blockheaders.forEach((bh) => {
        editedBlockheaders.push(addHex(bh))
      })
      res.blockheaders = editedBlockheaders
    }
    return res
  },
  ts() {
    const x = moment.unix(this.header.timestamp.seconds)
    return moment(x).format('HH:mm:ss D MMM YYYY')
  },
  tsReadable() {
    const x = moment.unix(this.header.timestamp.seconds)
    return moment(x).fromNow()
  },
  interval() {
    const x = Math.round(this.block_interval)
    return `${x} seconds`
  },
  reward(rew) {
    let r = 'Undetermined'
    try {
      const x = parseFloat(rew) * 1e-9
      r = x
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
  numberTransactions() {
    const x = this.transaction_count.count
    //     UNKNOWN = 0;
    //     TRANSFER = 1;
    //     STAKE = 2;
    //     DESTAKE = 3;
    //     COINBASE = 4;
    //     LATTICE = 5;
    //     DUPLICATE = 6;
    //     VOTE = 7;
    return sumValues(x)
  },
})

Template.lastblocks.events({
  'click .close': () => {
    $('.message').hide()
  },
  'click .item': (event) => {
    const blockTarget = $(event.target).parentsUntil('.items').closest('.item[data-block]').attr('data-block')
    FlowRouter.go(`/block/${blockTarget}`)
  },
})
