import JSONFormatter from 'json-formatter-js'

const renderTokens = () => {
  const tokenText = FlowRouter.getParam('tokenText')
  if (tokenText) {
    Meteor.call('tokenByText', tokenText, (err, res) => {
      if (err) {
        Session.set('tokens', { error: err, param: tokenText, found: false })
        return false
      }
      Session.set('tokens', res)
      const formatter = new JSONFormatter(res)
      $('#tokensjson').html(formatter.render())
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

Template.tokens.helpers({
  id() {
    return FlowRouter.getParam('tokenText')
  },
  loading() {
    try {
      const status = Session.get('loading')
      return status
    } catch (e) {
      return false
    }
  },
  results() {
    if (!(Session.get('loading'))) {
      try {
        const results = Session.get('tokens')
        return results
      } catch (e) {
        return false
      }
    }
    return false
  },
  quantity() {
    if (!(Session.get('loading'))) {
      try {
        const results = Session.get('tokens').length
        return results
      } catch (e) {
        return false
      }
    }
    return false
  },
})

Template.tokens.events({
  'click .meta': () => {
    if ($('.meta').hasClass('dropdown-toggle')) {
      $('.meta').removeClass('dropdown-toggle')
      $('.toggle').show()
    } else {
      $('.meta').addClass('dropdown-toggle')
      $('.toggle').hide()
    }
  },
  'click tr': (event) => {
    FlowRouter.go(`/tx/${$(event.currentTarget).attr('data-txhash')}`)
  },
})

Template.tokens.onCreated(() => {
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    Session.set('tokens', {})
    Session.set('loading', true)
    $('#blockjson').html('')
    $('.data').addClass('loaded')
    $('.meta').addClass('dropdown-toggle')
    $('.toggle').hide()
    // Session.set('qrl', 0)
    // Session.set('status', {})
    renderTokens()
  })
})
