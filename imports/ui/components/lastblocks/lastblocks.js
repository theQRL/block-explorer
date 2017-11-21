import './lastblocks.html'

Template.lastblocks.onCreated(() => {
  Session.set('lastblocks', {})
  Meteor.call('lastblocks', (err, res) => {
    if (err) {
      Session.set('lastblocks', { error: err })
    } else {
      Session.set('lastblocks', res)
    }
  })
})

Template.lastblocks.helpers({
  lastblocks() {
    return Session.get('lastblocks')
  },
  ts() {
    const x = moment.unix(this.header.timestamp.seconds)
    return moment(x).format('HH:mm D MMM YYYY')
  },
  interval() {
    const x = Math.round(this.block_interval)
    return `${x} seconds`
  },
  reward(rew) {
    let r = 'Undetermined'
    try {
      const x = parseFloat(rew) / 100000000
      r = x
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
  txCount() {
    return this.transactions.length
  },
  // hash() {
  //   let hex = Buffer.from(this.header.hash_header).toString('hex');
  //   return hex
  // },
})

Template.lastblocks.events({
  'click .refresh': () => {
    Session.set('lastblocks', {})
    Meteor.call('lastblocks', (err, res) => {
      if (err) {
        Session.set('lastblocks', { error: err })
      } else {
        Session.set('lastblocks', res)
      }
    })
  },
  'click .close': () => {
    $('.message').hide()
  },
})
