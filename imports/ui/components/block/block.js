import './block.html'
import JSONFormatter from 'json-formatter-js'

Template.block.onCreated(() => {
  Session.set('block', {})
  const blockId = parseInt(FlowRouter.getParam('blockId'), 10)
  if (blockId) {
    Meteor.call('block', blockId, (err, res) => {
      // The method call sets the Session variable to the callback value
      if (err) {
        Session.set('block', { error: err, id: blockId })
      } else {
        Session.set('block', res)
      }
    })
  }
})

Template.block.helpers({
  block() {
    return Session.get('block')
  },
  blockdata() {
    return JSON.stringify(Session.get('block'), true, 2)
  },
  ts() {
    try {
      const x = moment.unix(this.blockheader.timestamp)
      return moment(x).format('HH:mm D MMM YYYY')
    } catch (e) {
      return ' '
    }
  },
  color() {
    if (this.subtype === 'COINBASE') {
      return 'teal'
    }
    if (this.subtype === 'STAKE') {
      return 'red'
    }
    if (this.subtype === 'TX') {
      return 'yellow'
    }
    return ''
  },
  json() {
    const myJSON = this
    const formatter = new JSONFormatter(myJSON)
    $('.json').append(formatter.render())
  },
})

Template.block.events({
  'click .close': () => {
    $('.message').hide()
  },
  'click .jsonclick': () => {
    $('.jsonbox').toggle()
  },
})

Template.block.onRendered(() => {
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    const blockId = parseInt(FlowRouter.getParam('blockId'), 10)
    Meteor.call('block', blockId, (err, res) => {
      if (err) {
        Session.set('block', { error: err })
      } else {
        Session.set('block', res)
      }
    })
  })
})