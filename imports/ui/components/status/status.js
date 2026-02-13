import { quantausd, Blocks } from '/imports/api/index.js'
import './status.html'
import { SHOR_PER_QUANTA } from '../../../startup/both/index.js'

const supplyFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const STATUS_TIME_TICK_KEY = 'status-time-tick'

function formatDurationFromSeconds(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '--'
  }

  const seconds = Math.floor(totalSeconds)
  if (seconds < 60) {
    return `${seconds}s`
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainder = seconds % 60
    return `${minutes}m ${remainder}s`
  }

  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  return `${days}d ${hours}h`
}

Template.status.onCreated(function () {
  Meteor.subscribe('quantausd')
  Meteor.subscribe('status')
  Meteor.subscribe('blocks')

  Session.set(STATUS_TIME_TICK_KEY, Math.floor(Date.now() / 1000))
  this.statusTickHandle = Meteor.setInterval(() => {
    Session.set(STATUS_TIME_TICK_KEY, Math.floor(Date.now() / 1000))
  }, 1000)
})

Template.status.onDestroyed(function () {
  if (this.statusTickHandle) {
    Meteor.clearInterval(this.statusTickHandle)
  }
})

Template.status.helpers({
  quantaUsd() {
    const quote = quantausd.findOne()
    if (!quote || !Number.isFinite(quote.price)) {
      return '--'
    }
    return currencyFormatter.format(quote.price)
  },
  marketCap() {
    const x = Session.get('explorer-status')
    const quote = quantausd.findOne()

    if (!x || !quote || !Number.isFinite(quote.price)) {
      return '--'
    }

    const coinsInCirculation = parseFloat(x.coins_emitted) / SHOR_PER_QUANTA
    const marketCap = quote.price * coinsInCirculation
    if (!Number.isFinite(marketCap)) {
      return '--'
    }

    return currencyFormatter.format(marketCap)
  },
  status() {
    const response = Session.get('explorer-status')
    return response
  },
  uptime() {
    const x = Session.get('explorer-status')
    const uptime = moment.duration(parseInt(x.uptime_network, 10), 'seconds')
    return moment.duration(uptime, 'seconds').format('D[d] h[h] m[min]')
  },
  emission() {
    const x = Session.get('explorer-status')
    let r = 'Undetermined'
    try {
      // eslint-disable-next-line
      r = Math.round(((parseFloat(x.coins_emitted) / SHOR_PER_QUANTA) / parseFloat(x.coins_total_supply)) * 100)
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
  emission_raw() {
    const x = Session.get('explorer-status')
    let r = '?'
    try {
      r = (parseFloat(x.coins_emitted) / SHOR_PER_QUANTA)
      r = r.toFixed(2)
      r = r.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,')
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
  totalSupply() {
    const x = Session.get('explorer-status')
    let r = 'Undetermined'
    try {
      r = supplyFormatter.format(parseFloat(x.coins_total_supply))
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
  reward(rew) {
    let r = 'Undetermined'
    try {
      const x = parseFloat(rew) / SHOR_PER_QUANTA
      r = `${x}`
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
  unmined() {
    const x = Session.get('explorer-status')
    let r = 'Undetermined'
    try {
      r = parseFloat(x.coins_total_supply) - (parseFloat(x.coins_emitted) / SHOR_PER_QUANTA)
      r = r.toFixed(2)
      r = r.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,')
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
  max_block_index() {
    const x = Session.get('explorer-status')
    let r = 'Undetermined'
    try {
      r = x.node_info.block_height
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
  timeSinceLastBlock() {
    const blocksDocument = Blocks.findOne()
    if (!blocksDocument || !Array.isArray(blocksDocument.blockheaders) || blocksDocument.blockheaders.length === 0) {
      return '--'
    }

    const latestBlock = blocksDocument.blockheaders.reduce((latest, candidate) => {
      const latestTs = latest && latest.header ? Number(latest.header.timestamp_seconds || 0) : 0
      const candidateTs = candidate && candidate.header ? Number(candidate.header.timestamp_seconds || 0) : 0
      return candidateTs > latestTs ? candidate : latest
    }, blocksDocument.blockheaders[0])

    const latestTimestamp = latestBlock && latestBlock.header
      ? Number(latestBlock.header.timestamp_seconds)
      : NaN
    if (!Number.isFinite(latestTimestamp) || latestTimestamp <= 0) {
      return '--'
    }

    const nowTimestamp = Session.get(STATUS_TIME_TICK_KEY) || Math.floor(Date.now() / 1000)
    const elapsed = Math.max(0, nowTimestamp - latestTimestamp)
    return formatDurationFromSeconds(elapsed)
  },
})
