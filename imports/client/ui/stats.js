import validateQrlAddress from '@theqrl/validate-qrl-address'

import {
  SHOR_PER_QUANTA,
  numberWithCommas,
} from '../../functions.js'

const renderStats = () => {
  Meteor.call('richlist', 15, (err, res) => {
    if (err) {
      console.log(err)
      return false
    }
    const richlist = []
    res.forEach((item, index) => {
      let css = ''
      if (index < 5) { css = '#C98910' }
      if (index > 4 && index < 10) { css = '#A8A8A8' }
      if (index > 9) { css = '#965A38' }
      richlist.push({
        address: `Q${item.address}`,
        balance: numberWithCommas(parseInt(item.balance, 10) / SHOR_PER_QUANTA),
        position: index + 1,
        css,
      })
    })
    Session.set('stats', { richlist })

    Meteor.call('totalAddresses', (errTA, resTA) => {
      if (err) {
        console.log(err)
        return false
      }
      const soFar = Session.get('stats')
      soFar.addresses = resTA
      Session.set('stats', soFar)
      $('.data').removeClass('loaded')
      Session.set('loading', false)
      return true
    })

    Meteor.call('totalTransactions', (errTA, resTA) => {
      if (err) {
        console.log(err)
        return false
      }
      const soFar = Session.get('stats')
      soFar.transactions = resTA
      Session.set('stats', soFar)
      $('.data').removeClass('loaded')
      Session.set('loading', false)
      return true
    })

    Meteor.call('networkStart', (errTA, resTA) => {
      if (err) {
        console.log(err)
        return false
      }
      const soFar = Session.get('stats')
      soFar.start = resTA
      Session.set('stats', soFar)
      $('.data').removeClass('loaded')
      Session.set('loading', false)
      return true
    })

    return true
  })
}

Template.stats.helpers({
  richlist() {
    try {
      const richlist = Session.get('stats').richlist // eslint-disable-line
      return richlist
    } catch (e) {
      return false
    }
  },
  loading() {
    try {
      const status = Session.get('loading')
      return status
    } catch (e) {
      return false
    }
  },
  totalAddresses() {
    try {
      const ta = Session.get('stats').addresses.count // eslint-disable-line
      return ta
    } catch (e) {
      return false
    }
  },
  totalTransactions() {
    try {
      const ta = Session.get('stats').transactions.count // eslint-disable-line
      return ta
    } catch (e) {
      return false
    }
  },
  uptime() {
    try {
      const ta = Session.get('stats').start.count // eslint-disable-line
      const x = moment.unix(ta)
      const today = moment().startOf('day')
      return Math.round(moment.duration(today - x).asDays())
    } catch (e) {
      return false
    }
  },
})

Template.stats.events({
  'click tr': (event) => {
    if (event.target.innerHTML.length === 79) {
      if (validateQrlAddress.hexString(event.target.innerHTML).result) {
        FlowRouter.go(`/a/${event.target.innerHTML}`)
      }
    }
  },
})

Template.stats.onCreated(() => {
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    Session.set('stats', {})
    Session.set('loading', true)
    $('#blockjson').html('')
    $('.data').addClass('loaded')
    $('.meta').addClass('dropdown-toggle')
    $('.toggle').hide()
    // Session.set('qrl', 0)
    // Session.set('status', {})
    renderStats()
  })
})
