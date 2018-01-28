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
})

Template.status.helpers({
  status() {
    return Session.get('status')
  },
  uptime() {
    let x = Session.get('status')
    x = x.uptime_network
    return moment('1900-01-01 00:00:00').add(x, 'seconds').format('d[d] h[h] mm[min]')
  },
  emission() {
    const x = Session.get('status')
    let r = 'Undetermined'
    try {
      r = Math.round((parseFloat(x.coins_emitted) / parseFloat(x.coins_total_supply))
        * 10000)
        / 1000000000
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
      r = parseFloat(x.coins_total_supply) - (parseFloat(x.coins_emitted) / 10000000)
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
  },
  'click .close': () => {
    $('.message').hide()
  },
})
