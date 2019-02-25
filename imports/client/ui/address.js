import JSONFormatter from 'json-formatter-js'

const renderAddress = () => {
  const aId = FlowRouter.getParam('aId')
  if (aId) {
    Meteor.call('address', aId, (err, res) => {
      if (err) {
        Session.set('address', { error: err, id: aId, found: false })
        return false
      }
      Session.set('address', res)
      const formatter = new JSONFormatter(res)
      $('#addressjson').html(formatter.render())
      $('.data').removeClass('loaded')
      Session.set('loading', false)
      return true
    })
  //   Meteor.call('QRLvalue', (err, res) => {
  //     if (err) {
  //       Session.set('qrl', 'Error getting value from API')
  //     } else {
  //       Session.set('qrl', res)
  //     }
  //   })
  //   Meteor.call('status', (err, res) => {
  //     if (err) {
  //       Session.set('status', { error: err })
  //     } else {
  //       Session.set('status', res)
  //     }
  //   })
  }
}

Template.address.helpers({
  id() {
    return FlowRouter.getParam('aId')
  },
  loading() {
    try {
      const status = Session.get('loading')
      return status
    } catch (e) {
      return false
    }
  },
})

Template.address.onRendered(() => {
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    Session.set('address', {})
    Session.set('loading', true)
    $('#blockjson').html('')
    // Session.set('qrl', 0)
    // Session.set('status', {})
    renderAddress()
  })
})
