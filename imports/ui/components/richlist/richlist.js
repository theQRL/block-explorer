import { BigNumber } from 'bignumber.js'
import { SHOR_PER_QUANTA } from '../../../startup/both/index.js'

import './richlist.html'

BigNumber.config({ EXPONENTIAL_AT: 1e9 })

Template.richlist.onCreated(() => {
  Session.set('richlist', 'loading')
  Session.set('richlistError', false)
  Session.set('richlistData', {})
  // Add session variables for latest block
  Session.set('latestBlock', null)
  Session.set('latestBlockError', false)
  
  Meteor.call('connectionStatus', (error, result) => {
    if (result.network === 'mainnet') {
      Session.set('network', 'Mainnet')
      return
    }
    Session.set('network', 'Testnet')
  })
  
  // Fetch latest block information
  fetch('https://richlist-api.theqrl.org/richlist/latest-block').then((response) => {
    if (response.status === 200) {
      response.json().then((blockData) => {
        Session.set('latestBlock', blockData)
        Session.set('latestBlockError', false)
      })
    } else {
      Session.set('latestBlockError', true)
    }
  }).catch(() => {
    Session.set('latestBlockError', true)
  })
  
  fetch('https://richlist-api.theqrl.org/richlist?page=0').then((response) => {
    if (response.status !== 200) {
      Session.set('richlist', 'error')
      Session.set('richlistError', true)
      return
    }
    response.json().then((data) => {
      Session.set('richlist', 0)
      Session.set('richlistError', false)
      Session.set('richlistData', data)
    })
  })
})

Template.richlist.helpers({
  networkIsMainnet() {
    if (Session.get('network') === 'Mainnet') {
      return true
    }
    return false
  },
  richlistLoading() {
    if (Session.get('richlist') === 'loading') {
      return true
    }
    return false
  },
  richlistButtonLoading() {
    if (Session.get('richlistButton') === 'loading') {
      return true
    }
    return false
  },
  richlistError() {
    if (Session.get('richlistError')) {
      return true
    }
    return false
  },
  richlistData() {
    return Session.get('richlistData')
  },
  latestBlock() {
    return Session.get('latestBlock')
  },
  latestBlockError() {
    return Session.get('latestBlockError')
  },
  rank(i) {
    return i + 1
  },
  shorToQuanta(shor) {
    const s = new BigNumber(shor)
    return s.dividedBy(SHOR_PER_QUANTA).toString()
  },
})

Template.richlist.events({
  'click #fetchMore': () => {
    let page = Session.get('richlist')
    page += 1
    Session.set('richlistButton', 'loading')
    fetch(`https://richlist-api.theqrl.org/richlist?page=${page}`).then((response) => {
      if (response.status !== 200) {
        Session.set('richlist', 'error')
        Session.set('richlistError', true)
        return
      }
      response.json().then((data) => {
        Session.set('richlistButton', 'loaded')
        Session.set('richlist', page)
        Session.set('richlistError', false)
        const richlistData = Session.get('richlistData')
        richlistData.push(...data)
        Session.set('richlistData', richlistData)
      })
    })
  },
  'click #csvExport': () => {
    window.location.href = 'https://richlist-api.theqrl.org/richlist?csv=1'
  },
})
