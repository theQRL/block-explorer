const identifySearch = (str) => {
  const type = { parameter: str, type: 'Undetermined' }
  // if 3 chars or more, assume search token data
  if (str.length > 2) {
    type.type = 'Token'
    type.route = `/tokens/${str}`
    type.method = 'tokenByText'
  }
  if (str.length === 79 && str.charAt(0).toLowerCase() === 'q') {
    type.type = 'Address'
    type.route = `/a/Q${str.slice(1, 79)}`
    type.method = 'address'
  }
  if (str.length === 78 && str.charAt(0).toLowerCase() !== 'q') {
    type.type = 'Address'
    type.route = `/a/Q${str}`
    type.method = 'address'
  }
  if ((str.length === 64) && (parseInt(str, 10) !== str)) {
    type.type = 'Txhash'
    type.route = `/tx/${str}`
    type.method = 'tx'
  }
  if ((parseInt(str, 10).toString()) === str) {
    type.type = 'Block'
    type.route = `/block/${str}`
    type.method = 'block'
  }
  return type
}

Template.search.events({
  'submit form, click #button-search': (event, templateInstance) => {
    event.preventDefault()
    const searchString = templateInstance.find('#searchBox').value
    const action = identifySearch(searchString)
    if (action.type !== 'Undetermined') {
      templateInstance.$('#searchBox').val('')
      FlowRouter.go(action.route)
    }
  },
})

Template.searchpage.helpers({
  loading: () => Session.get('loading'),
  noConnection: () => {
    // $('div.alert-danger').hide()
    const c = Session.get('noConnection')
    const l = true
    if (c && l) { return true }
    return false
  },
})

Template.searchpage.onCreated(() => {
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
