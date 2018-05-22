import { FlowRouter } from 'meteor/kadira:flow-router'
import { BlazeLayout } from 'meteor/kadira:blaze-layout'

// Import needed templates
import '../../ui/layouts/body/body.js'
import '../../ui/pages/home/home.js'
import '../../ui/pages/not-found/not-found.js'
import '../../ui/components/tx/tx.js'
import '../../ui/components/address/address.js'
import '../../ui/components/stakers/stakers.js'
import '../../ui/components/nextstakers/nextstakers.js'
import '../../ui/components/lastblocks/lastblocks.js'
import '../../ui/components/lasttx/lasttx.js'
import '../../ui/components/lastunconfirmedtx/lastunconfirmedtx.js'
import '../../ui/components/richlist/richlist.js'
import '../../ui/components/block/block.js'
import '../../ui/components/peerstats/peerstats.js'
import '../../ui/components/search/search.js'
import '../../ui/mobile/mobile.js'

// Set up all routes in the app

function useMobile() {
  // detect Retina display:
  const retina = window.matchMedia('(-webkit-min-device-pixel-ratio: 2)').matches
  // set mobile limits
  let mobileLimit = 640
  if (retina) { mobileLimit *= 2 }
  // route based on screensize
  if (window.matchMedia(`(min-width: ${mobileLimit}px)`).matches) {
    return true
  }
  return false
}

FlowRouter.route('/', {
  name: 'App.home',
  action() {
    if (useMobile()) {
      BlazeLayout.render('appBody', { main: 'appHome' })
    } else {
      BlazeLayout.render('mobile', { main: 'status' })
    }
  },
})
FlowRouter.route('/tx/:txId', {
  name: 'Tx.home',
  action() {
    if (useMobile()) {
      BlazeLayout.render('appBody', { main: 'tx' })
    } else {
      BlazeLayout.render('mobile', { main: 'tx' })
    }
  },
})
FlowRouter.route('/block/:blockId', {
  name: 'Block.home',
  action() {
    if (useMobile()) {
      BlazeLayout.render('appBody', { main: 'block' })
    } else {
      BlazeLayout.render('mobile', { main: 'block' })
    }
  },
})
FlowRouter.route('/a/:aId/:tPage?', {
  name: 'Address.home',
  action() {
    if (useMobile()) {
      BlazeLayout.render('appBody', { main: 'address' })
    } else {
      BlazeLayout.render('mobile', { main: 'address' })
    }
  },
})
FlowRouter.route('/lastblocks', {
  name: 'Lastblocks.home',
  action() {
    if (useMobile()) {
      BlazeLayout.render('appBody', { main: 'lastblocks' })
    } else {
      BlazeLayout.render('mobile', { main: 'lastblocks' })
    }
  },
})
FlowRouter.route('/status', {
  name: 'Status.home',
  action() {
    if (useMobile()) {
      BlazeLayout.render('appBody', { main: 'status' })
    } else {
      BlazeLayout.render('mobile', { main: 'status' })
    }
  },
})
FlowRouter.route('/search', {
  name: 'Search.home',
  action() {
    if (useMobile()) {
      BlazeLayout.render('appBody', { main: 'search' })
    } else {
      BlazeLayout.render('mobile', { main: 'search' })
    }
  },
})
FlowRouter.route('/lasttx', {
  name: 'Lasttx.home',
  action() {
    if (useMobile()) {
      BlazeLayout.render('appBody', { main: 'lasttx' })
    } else {
      BlazeLayout.render('mobile', { main: 'lasttx' })
    }
  },
})
FlowRouter.route('/unconfirmed', {
  name: 'Lastunconfirmedtx.home',
  action() {
    if (useMobile()) {
      BlazeLayout.render('appBody', { main: 'lastunconfirmedtx' })
    } else {
      BlazeLayout.render('mobile', { main: 'lastunconfirmedtx' })
    }
  },
})
FlowRouter.route('/peers', {
  name: 'Peerstats.home',
  action() {
    if (useMobile()) {
      BlazeLayout.render('appBody', { main: 'peerstats' })
    } else {
      BlazeLayout.render('mobile', { main: 'peerstats' })
    }
  },
})
FlowRouter.notFound = {
  action() {
    if (useMobile()) {
      BlazeLayout.render('appBody', { main: 'appBotFound' })
    } else {
      BlazeLayout.render('mobile', { main: 'appBotFound' })
    }
  },
}
