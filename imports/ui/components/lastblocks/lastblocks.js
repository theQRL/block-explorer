import { Blocks } from '/imports/api/index.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './lastblocks.html'
import { rawAddressToHexAddress } from '@theqrl/explorer-helpers'
import { SHOR_PER_QUANTA, hexOrB32 } from '../../../startup/both/index.js'
import { MINING_POOLS } from '../../../startup/client/mining-pools.js'

const addHex = (b) => {
  const result = b
  result.header.hash_header_hex = Buffer.from(result.header.hash_header).toString('hex')
  return result
}

const sumValues = (obj) => Object.values(obj).reduce((a, b) => a + b)

const findMiningPool = (minedBy) => {
  if (!minedBy) {
    return null
  }

  try {
    const minerHexAddress = rawAddressToHexAddress(minedBy)
    return MINING_POOLS.find((pool) => pool.address === minerHexAddress) || null
  } catch (e) {
    return null
  }
}

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
  isKnownPool() {
    return !!findMiningPool(this.minedBy)
  },
  poolName() {
    const pool = findMiningPool(this.minedBy)
    return pool ? pool.name : ''
  },
  poolLink() {
    const pool = findMiningPool(this.minedBy)
    return pool ? pool.link : ''
  },
  minerAddress() {
    if (!this.minedBy) return 'Unknown'
    try {
      return hexOrB32(this.minedBy)
    } catch (e) {
      return 'Unknown'
    }
  },
  minerTip() {
    return this.minedBy
  },
  interval() {
    // Get the current block data
    const res = Blocks.findOne()
    if (!res || !res.blockheaders) {
      return 'N/A'
    }

    // Find the current block in the list
    const currentBlockIndex = res.blockheaders.findIndex((block) => (
      block.header.block_number === this.header.block_number
    ))

    if (currentBlockIndex === -1 || currentBlockIndex === 0) {
      // If this is the first block (index 0) or not found, return N/A
      return 'N/A'
    }

    // Get the previous block (lower block number, earlier timestamp)
    const previousBlock = res.blockheaders[currentBlockIndex - 1]

    if (!previousBlock) {
      return 'N/A'
    }

    // Calculate the time difference
    const currentTime = parseInt(this.header.timestamp_seconds, 10)
    const previousTime = parseInt(previousBlock.header.timestamp_seconds, 10)
    const intervalSeconds = currentTime - previousTime

    if (intervalSeconds < 0) {
      return 'N/A'
    }

    return `${Math.round(intervalSeconds)}s`
  },
  transacted(rew) {
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
    const route = event.currentTarget.getAttribute('data-dest')
    FlowRouter.go(`/block/${route}`)
    window.scrollTo(0, 0)
  },
})
