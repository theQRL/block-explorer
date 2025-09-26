import { BigNumber } from 'bignumber.js'
import { SHOR_PER_QUANTA } from '../../../startup/both/index.js'
import './richlist.html'

BigNumber.config({ EXPONENTIAL_AT: 1e9 })

Template.richlist.onCreated(() => {
  Meteor.subscribe('status')
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
  fetch('https://richlist-api.theqrl.org/richlist/latest-block')
    .then((response) => {
      if (response.status === 200) {
        response.json().then((blockData) => {
          Session.set('latestBlock', blockData)
          Session.set('latestBlockError', false)
        })
      } else {
        Session.set('latestBlockError', true)
      }
    })
    .catch(() => {
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
  percentage() {
    // Get the total emission from status
    const status = Session.get('explorer-status')
    if (!status || !status.coins_emitted) {
      return '0.00'
    }

    try {
      // Calculate percentage: (balance / total_emission) * 100
      const totalEmission = new BigNumber(status.coins_emitted)
      const balance = new BigNumber(this.balance)
      const percentage = balance.dividedBy(totalEmission).multipliedBy(100)

      return percentage.toFixed(2)
    } catch (error) {
      console.error('Error calculating percentage:', error)
      return '0.00'
    }
  },
  balance() {
    // Format balance properly
    if (this.balance) {
      return this.balance
    }
    return '0'
  },
})

Template.richlist.events({
  'click #fetchMore': () => {
    let page = Session.get('richlist')
    page += 1
    Session.set('richlistButton', 'loading')
    fetch(`https://richlist-api.theqrl.org/richlist?page=${page}`)
      .then((response) => {
        if (response.status !== 200) {
          Session.set('richlistButton', 'error')
          return
        }
        response.json().then((data) => {
          const currentData = Session.get('richlistData')
          const newData = currentData.concat(data)
          Session.set('richlistData', newData)
          Session.set('richlist', page)
          Session.set('richlistButton', 'success')
        })
      })
      .catch(() => {
        Session.set('richlistButton', 'error')
      })
  },
  'click #csvExport': () => {
    const data = Session.get('richlistData')
    if (data && data.length > 0) {
      let csv = 'Rank,Address,Balance (Quanta),Percentage\n'
      data.forEach((item, index) => {
        // Calculate percentage using the same logic as the template
        const status = Session.get('explorer-status')
        let percentage = '0.00'
        if (status && status.coins_emitted) {
          const totalEmission = new BigNumber(status.coins_emitted)
          const balance = new BigNumber(item.balance)
          percentage = balance
            .dividedBy(totalEmission)
            .multipliedBy(100)
            .toFixed(2)
        }
        csv += `${index + 1},${item.address},${item.balance},${percentage}\n`
      })

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'qrl-richlist.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    }
  },
})
