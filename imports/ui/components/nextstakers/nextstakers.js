import './nextstakers.html'

const renderNextStakersBlock = () => {
  Meteor.call('stakers', { filter: 'NEXT', offset: 0, quantity: 100 }, (err, res) => {
    if (err) {
      Session.set('nextstakers', { error: err })
    } else {
      Session.set('nextstakers', res)
    }
  })
}

Template.nextstakers.onCreated(() => {
  Session.set('nextstakers', [])
  renderNextStakersBlock()
})

Template.nextstakers.helpers({
  nextstakers() {
    return Session.get('nextstakers')
  },
})

Template.nextstakers.events({
  'click .refresh': () => {
    renderNextStakersBlock()
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
