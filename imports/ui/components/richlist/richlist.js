import { BigNumber } from 'bignumber.js'
import { SHOR_PER_QUANTA } from '../../../startup/both/index.js'

import './richlist.html'

BigNumber.config({ EXPONENTIAL_AT: 1e9 })

Template.richlist.onCreated(() => {
  Session.set('richlist', 'loading')
  Session.set('richlistError', false)
  Session.set('richlistData', {})
  Meteor.call('connectionStatus', (error, result) => {
    if (result.network === 'mainnet') {
      Session.set('network', 'Mainnet')
      return
    }
    Session.set('network', 'Testnet')
  })
  fetch('https://richlist-api.theqrl.org/richlist').then((response) => {
    if (response.status !== 200) {
      Session.set('richlist', 'error')
      Session.set('richlistError', true)
      return
    }
    response.json().then((data) => {
      Session.set('richlist', 'loaded')
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
  richlistError() {
    if (Session.get('richlistError')) {
      return true
    }
    return false
  },
  richlistData() {
    return Session.get('richlistData')
  },
  rank(i) {
    return i + 1
  },
  shorToQuanta(shor) {
    const s = new BigNumber(shor)
    return s.dividedBy(SHOR_PER_QUANTA).toString()
  },
})
