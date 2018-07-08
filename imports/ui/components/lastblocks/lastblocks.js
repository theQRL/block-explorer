import { Blocks } from '/imports/api/index.js'
import './lastblocks.html'
import { SHOR_PER_QUANTA } from '../../../startup/both/index.js'
import { MINING_POOLS } from '../../../startup/client/mining-pools.js'

const addHex = (b) => {
  const result = b
  result.header.hash_header_hex = Buffer.from(result.header.hash_header).toString('hex')
  return result
}

const sumValues = obj => Object.values(obj).reduce((a, b) => a + b)

Template.lastblocks.onCreated(() => {
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
    const x = moment.unix(this.header.timestamp_seconds)
    return moment(x).format('HH:mm:ss D MMM YYYY')
  },
  tsReadable() {
    const x = moment.unix(this.header.timestamp_seconds)
    return moment(x).fromNow()
  },
  miner() {
    const x = this.minedBy
    let ret = ''
    MINING_POOLS.forEach((value) => {
      if (value.address === x) {
        ret = `Mined by <a href='${value.link}' target="_blank">${value.name}</a>`
      }
    })
    if (ret === '') {
      return `Mined by ${x}`
    }
    return ret
  },
  interval() {
    const x = Math.round(this.block_interval)
    return `${x} seconds`
  },
  reward(rew) {
    let r = 'Undetermined'
    try {
      const x = (parseInt(rew, 10) / SHOR_PER_QUANTA).toFixed(9)
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
  'click .lastBlocks': (event) => {
    const route = event.currentTarget.childNodes[1].childNodes[1].childNodes[1].childNodes[1].childNodes[1].childNodes[3].childNodes[0].getAttribute('href')
    FlowRouter.go(route)
  },

})
