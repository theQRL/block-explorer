import './stakers.html'

Template.stakers.onCreated(() => {
  Session.set('stakers', {})
  Meteor.call('stakers', (err, res) => {
    if (err) {
      Session.set('stakers', { error: err })
    } else {
      Session.set('stakers', res)
    }
  })
})

Template.stakers.helpers({
  stakers() {
    return Session.get('stakers')
  },
})

Template.stakers.events({
  'click .refresh': () => {
    Session.set('stakers', {})
    Meteor.call('stakers', (err, res) => {
      if (err) {
        Session.set('stakers', { error: err })
      } else {
        Session.set('stakers', res)
      }
    })
  },
  'click .close': () => {
    $('.message').hide()
  },
  'click .hashShow': (event) => {
    $(event.target).parent().parent().parent()
      .parent()
      .parent()
      .children('.row')
      .toggle()
  },
})
