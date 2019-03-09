import JSONFormatter from 'json-formatter-js'

const renderTx = () => {
  const txId = FlowRouter.getParam('txId')
  if (txId) {
    Meteor.call('tx', txId, (err, res) => {
      if (err) {
        Session.set('tx', { error: err, id: txId, found: false })
        return false
      }
      Session.set('tx', res)
      const formatter = new JSONFormatter(res)
      $('#txjson').html(formatter.render())
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

Template.tx.helpers({
  id() {
    return FlowRouter.getParam('txId')
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

Template.tx.events({
  'click .meta': () => {
    if ($('.meta').hasClass('dropdown-toggle')) {
      $('.meta').removeClass('dropdown-toggle')
      $('.toggle').show()
    } else {
      $('.meta').addClass('dropdown-toggle')
      $('.toggle').hide()
    }
  },
})

Template.tx.onCreated(() => {
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    Session.set('tx', {})
    Session.set('loading', true)
    $('#blockjson').html('')
    $('.data').addClass('loaded')
    $('.meta').addClass('dropdown-toggle')
    $('.toggle').hide()
    // Session.set('qrl', 0)
    // Session.set('status', {})
    renderTx()
  })
})
