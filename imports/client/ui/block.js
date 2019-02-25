import JSONFormatter from 'json-formatter-js'

const renderBlock = () => {
  const blockId = FlowRouter.getParam('blockId')
  if (blockId) {
    Meteor.call('block', blockId, (err, res) => {
      if (err) {
        Session.set('block', { error: err, id: blockId, found: false })
        return false
      }
      Session.set('block', res)
      const formatter = new JSONFormatter(res)
      $('#blockjson').html(formatter.render())
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

Template.block.helpers({
  id() {
    return FlowRouter.getParam('blockId')
  },
  loading() {
    try {
      const status = Session.get('loading')
      return status
    } catch (e) {
      return false
    }
  },
  prev() {
    const current = parseInt(FlowRouter.getParam('blockId'), 10)
    if (current > 1) {
      return `/block/${current - 1}`
    }
    return ''
  },
  prev_available() {
    const current = parseInt(FlowRouter.getParam('blockId'), 10)
    if (current > 1) {
      return ''
    }
    return 'disabled'
  },
  next() {
    const current = parseInt(FlowRouter.getParam('blockId'), 10)
    return `/block/${current + 1}`
  },
})

Template.block.events({
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

Template.block.onRendered(() => {
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    Session.set('block', {})
    Session.set('loading', true)
    $('#blockjson').html('')
    $('.data').addClass('loaded')
    $('.meta').addClass('dropdown-toggle')
    $('.toggle').hide()
    // Session.set('qrl', 0)
    // Session.set('status', {})
    renderBlock()
  })
})
