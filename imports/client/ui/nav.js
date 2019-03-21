Template.nav.helpers({
  noConnection: () => {
    $('div.alert-danger').hide()
    const c = Session.get('noConnection')
    const l = Session.get('loading')
    if (c && !l) { return true } else { return false }
  },
})

Template.nav.onCreated(() => {
  Session.set('noConnection', true)
  Session.set('loading', true)
  Meteor.call('networkConnection', (error, result) => {
    if (error) {
      Session.set('noConnection', true)
      Session.set('loading', false)
      return false
    }
    Session.set('noConnection', !result)
    Session.set('loading', false)
    return true
  })
})
