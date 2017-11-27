import './stakers.html'

const renderStakersBlock = () => {
  Meteor.call('stakers', { filter: 'CURRENT', offset: 0, quantity: 100 }, (err, res) => {
    if (err) {
      Session.set('stakers', { error: err })
    } else {
      Session.set('stakers', res)
    }
  })
}

Template.stakers.onCreated(() => {
  Session.set('stakers', [])
  renderStakersBlock()
})

Template.stakers.helpers({
  stakers() {
    return Session.get('stakers')
  },
})

Template.stakers.events({
  'click .refresh': () => {
    renderStakersBlock()
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
