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
    const x = moment.unix(this.timestamp)
    return moment(x).format('HH:mm D MMM YYYY')
  },
  interval() {
    const x = Math.round(this.block_interval)
    return `${x} seconds`
  },
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
