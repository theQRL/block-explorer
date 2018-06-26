import { quantausd, status } from '/imports/api/index.js'
import './status.html'
import { SHOR_PER_QUANTA } from '../../../startup/both/index.js'

Template.status.onCreated(() => {
  Meteor.subscribe('quantausd')
  Meteor.subscribe('status')
})

Template.status.helpers({
  quantaUsd() {
    let price = quantausd.findOne().price.toFixed(2)
    price = price.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,')
    return price
  },
  marketCap() {
    const x = status.findOne()
    const price = quantausd.findOne().price.toFixed(2)
    const coinsInCirculation = Math.round(parseFloat(x.coins_emitted) / SHOR_PER_QUANTA)
    let marketCap = Math.round(price * coinsInCirculation)
    marketCap = marketCap.toFixed(2)
    marketCap = marketCap.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,')
    return marketCap
  },
  status() {
    const response = status.findOne()
    return response
  },
  uptime() {
    let x = status.findOne()
    const uptime = moment.duration(parseInt(x.uptime_network, 10), 'seconds')
    return moment.duration(uptime, 'seconds').format('D[d] h[h] m[min]')
  },
  emission() {
    const x = status.findOne()
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
    const x = status.findOne()
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
  staked() {
    const x = status.findOne()
    let r = 'Undetermined'
    try {
      r = Math.round((parseFloat(x.coins_atstake) / parseFloat(x.coins_emitted)) * 10000) / 100
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
    const x = status.findOne()
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
    const x = status.findOne()
    let r = 'Undetermined'
    try {
      r = x.node_info.block_height
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
})
