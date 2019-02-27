const identifySearch = (str) => {
  const type = { parameter: str, type: 'Undetermined' }
  if (str.length === 79 && str.charAt(0) === 'Q') {
    type.type = 'Address'
    type.route = `/a/${str}`
    type.method = 'address'
  }
  if (str.length === 78 && str.charAt(0) !== 'Q') {
    type.type = 'Address'
    type.route = `/a/${str}`
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
  // otherwise, if 3 chars or more, assume search token data
  if (str.length > 2) {
    type.type = 'Token'
    type.route = `/tokens/${str}`
    type.method = 'tokenBySymbol'
  }
  return type
}

Template.search.events({
  'submit form, click #button-search': (event) => {
    event.preventDefault()
    const searchString = $('#searchBox').val()
    const action = identifySearch(searchString)
    if (action.type !== 'Undetermined') {
      FlowRouter.go(action.route)
    }
  },
})
