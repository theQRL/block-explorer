import './nextstakers.html'

Template.nextstakers.onCreated(() => {
  Session.set('nextstakers', {})
  Meteor.call('nextstakers', (err, res) => {
    if (err) {
      Session.set('nextstakers', { error: err })
    } else {
      Session.set('nextstakers', res)
    }
  })
})

Template.nextstakers.helpers({
  nextstakers() {
    return Session.get('nextstakers')
  },
})

Template.nextstakers.events({
  'click .refresh': () => {
    Session.set('nextstakers', {})
    Meteor.call('nextstakers', (err, res) => {
      if (err) {
        Session.set('nextstakers', { error: err })
      } else {
        Session.set('nextstakers', res)
      }
    })
  },
  'click .close': () => {
    $('.message').hide()
  },
  'click .hashShow': (e) => {
    console.log(e.target)
    $(e.target).parent().parent().parent().parent().parent().children('.row').toggle()
  },
})
