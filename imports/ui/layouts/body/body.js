import './body.html'
import './sidebar.html'

BlazeLayout.setRoot('body')
Template.appBody.onRendered(() => {
  $('.ui.dropdown').dropdown()
  $('.modal').modal()
  //$('.sidebar').first().sidebar('attach events', '#hamburger', 'show')
})

const identifySearch = (str) => {
  const type = { parameter: str, type: 'Undetermined' }
  if (str.length === 73 && str.charAt(0) === 'Q') {
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

Template.appBody.events({
  /*
  'click #hamburger': (event) => {
    event.preventDefault()
    $('.ui.sidebar').sidebar('toggle')
  },
  */
  'click .search': (event) => {
    const s = $(event.currentTarget).prev().val()
    postSearch(identifySearch(s))
  },
  'keypress input': (event) => {
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

Template.sidebar.events({
  click: (event) => {
    if (event.target.tagName !== 'INPUT') {
      $('.ui.sidebar').sidebar('toggle')
    }
  },
})
