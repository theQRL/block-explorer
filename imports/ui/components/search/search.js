import './search.html'

const identifySearch = (str) => {
  const type = { parameter: str, type: 'Undetermined' }
  if (str.length === 79 && str.charAt(0) === 'Q') {
    type.type = 'Address'
    type.route = `/a/${str}`
  }
  if ((str.length === 64) && (parseInt(str, 10) !== str)) {
    type.type = 'Txhash'
    type.route = `/tx/${str}`
  }
  if ((parseInt(str, 10).toString()) === str) {
    type.type = 'Block'
    type.route = `/block/${str}`
  }
  return type
}

const postSearch = (results) => {
  if (results.type !== 'Undetermined') {
    FlowRouter.go(results.route)
  }
}

Template.search.events({
  'click .search': (event) => {
    const s = $(event.currentTarget).prev().val()
    postSearch(identifySearch(s))
  },
  'keypress #mainSearch': (event) => {
    if (event.keyCode === 13) {
      // console.log('search clicked')
      if ($(':focus').is('input')) {
        const s = $(':focus').val()
        postSearch(identifySearch(s))
        event.stopPropagation()
        return false
      }
    }
    return true
  },
})
