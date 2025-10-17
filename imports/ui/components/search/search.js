import './search.html'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

const identifySearch = (str) => {
  let adjstr = str.trim()
  if (adjstr.charAt(0) === 'q') {
    adjstr = `Q${adjstr.substr(1, adjstr.length - 1)}`
    $('#mainSearch').val(adjstr)
  }
  console.log(adjstr)
  const type = { parameter: adjstr, type: 'Undetermined' }
  if (adjstr.length === 79 && adjstr.charAt(0) === 'Q') {
    type.type = 'Address'
    type.route = `/a/${adjstr}`
  }
  if ((adjstr.length === 64) && (parseInt(adjstr, 10) !== adjstr)) {
    type.type = 'Txhash'
    type.route = `/tx/${adjstr}`
  }
  if ((parseInt(adjstr, 10).toString()) === adjstr) {
    type.type = 'Block'
    type.route = `/block/${adjstr}`
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
Template.search.onRendered(() => {
  // Initialize Lucide icons for this template
  setTimeout(() => {
    if (window.reinitializeLucideIcons) {
      window.reinitializeLucideIcons()
    }
  }, 200)
  
  // Handle responsive placeholder
  const updatePlaceholder = () => {
    const searchInput = document.getElementById('mainSearch')
    if (searchInput) {
      if (window.innerWidth < 670) { // where text starts to break
        searchInput.placeholder = searchInput.getAttribute('data-placeholder-mobile')
      } else {
        searchInput.placeholder = 'Search by transaction, address, or block index'
      }
    }
  }
  
  // Set initial placeholder
  updatePlaceholder()
  
  // Update on resize
  window.addEventListener('resize', updatePlaceholder)
  
  if ($('.sidebar').hasClass('visible') && FlowRouter.getRouteName() === 'Search.home') {
    // sidebar is visible and on /find route
    this.$('.floatright').first().hide()
  }
})
Tracker.autorun(() => {
  FlowRouter.watchPathChange()
  // const context = FlowRouter.current()
  this.$('.floatright').show()
})
