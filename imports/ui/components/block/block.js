import './block.html'

Template.block.onCreated(() => {
  Session.set('block', {})
  const blockId = parseInt(FlowRouter.getParam('blockId'), 10)
  Meteor.call('block', blockId, (err, res) => {
    // The method call sets the Session variable to the callback value
    if (err) {
      Session.set('block', { error: err, id: blockId })
    } else {
      Session.set('block', res)
    }
  })
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
})

Template.block.events({
  'click .close': () => {
    $('.message').hide()
  },
})
