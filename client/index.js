/* eslint no-console: 0 */
import '../imports/client/ui/home.html'
import '../imports/client/ui/nav.html'
import '../imports/client/ui/nav.js'
import '../imports/client/ui/search.html'
import '../imports/client/ui/search.js'
import '../imports/client/ui/tx.html'
import '../imports/client/ui/tx.js'
import '../imports/client/ui/tokens.html'
import '../imports/client/ui/tokens.js'
import '../imports/client/ui/block.html'
import '../imports/client/ui/block.js'
import '../imports/client/ui/address.html'
import '../imports/client/ui/address.js'
import '../imports/client/ui/progress.html'
import '../imports/client/ui/stats.html'
import '../imports/client/ui/stats.js'
import '../imports/client/routes.js'
import './test-methods.js'


const toggleAffix = (affixElement, scrollElement, wrapper) => {
  const height = affixElement.outerHeight()
  const top = wrapper.offset().top // eslint-disable-line

  if (scrollElement.scrollTop() >= top) {
    wrapper.height(height)
    affixElement.addClass('affix')
  } else {
    affixElement.removeClass('affix')
    wrapper.height('auto')
  }
}

/* use toggleAffix on any data-toggle="affix" elements */
$('[data-toggle="affix"]').each(() => {
  const ele = $(this)
  const wrapper = $('<div></div>')

  ele.before(wrapper)
  $(window).on('scroll resize', () => {
    toggleAffix(ele, $(this), wrapper)
  })

  toggleAffix(ele, $(window), wrapper)
})

$(window).scroll(() => {
  if ($(document).scrollTop() > 20) {
    $('.navbar').addClass('affix')
  } else {
    $('.navbar').removeClass('affix')
  }
})
