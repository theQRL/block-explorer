import './status.html'

Template.status.onCreated(() => {
  Session.set('status', {})
  Meteor.call('status', (err, res) => {
    if (err) {
      Session.set('status', { error: err })
    } else {
      Session.set('status', res)
    }
  })

  Meteor.call('QRLvalue', (err, res) => {
    if (err) {
      Session.set('quantaUsd', { error: err })
    } else {
      Session.set('quantaUsd', res)
    }
  })
})

Template.status.helpers({
  quantaUsd() {
    let quantaUsd = Session.get('quantaUsd').toFixed(2)
    quantaUsd = quantaUsd.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
    return quantaUsd
  },
  marketCap() {
    const x = Session.get('status')
    let quantaUsd =  Session.get('quantaUsd').toFixed(2)
    let coinsInCirculation = Math.round(parseFloat(x.coins_emitted) / SHOR_PER_QUANTA)
    let marketCap = Math.round(quantaUsd * coinsInCirculation)
    marketCap = marketCap.toFixed(2)
    marketCap = marketCap.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
    return marketCap
  },
  status() {
    return Session.get('status')
  },
  uptime() {
    let x = Session.get('status')
    x = x.uptime_network
    return moment('1900-01-01 00:00:00').add(x, 'seconds').format('D[d] h[h] mm[min]')
  },
  emission() {
    const x = Session.get('status')
    let r = 'Undetermined'
    try {
      r = Math.round(((parseFloat(x.coins_emitted) / SHOR_PER_QUANTA) / parseFloat(x.coins_total_supply)) * 100)
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
  staked() {
    const x = Session.get('status')
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
      const x = parseFloat(rew) / 1000000000
      r = `${x}`
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
  unmined() {
    const x = Session.get('status')
    let r = 'Undetermined'
    try {
      r = parseFloat(x.coins_total_supply) - (parseFloat(x.coins_emitted) / SHOR_PER_QUANTA)
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
  max_block_index() {
    const x = Session.get('status')
    let r = 'Undetermined'
    try {
      r = x.node_info.block_height - 1
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  }
})

Template.status.events({
  'click .refresh': () => {
    Session.set('status', {})
    Meteor.call('status', (err, res) => {
      if (err) {
        Session.set('status', { error: err })
      } else {
        Session.set('status', res)
      }
    })
    Meteor.call('QRLvalue', (err, res) => {
      if (err) {
        Session.set('quantaUsd', { error: err })
      } else {
        Session.set('quantaUsd', res)
      }
    })
  },
  'click .close': () => {
    $('.message').hide()
  },
})
