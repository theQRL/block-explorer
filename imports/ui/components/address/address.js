/* eslint no-console: 0 */
/* ^^^ remove once testing complete
*/
import './address.html'
import '../../stylesheets/overrides.css'

const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

const renderAddressBlock = () => {
  const aId = FlowRouter.getParam('aId')
  if (aId) {
    const req = {
      address: Buffer.from(aId, 'ascii'),
    }
    Meteor.call('getAddressState', req, (err, res) => {
      if (err) {
        Session.set('address', { error: err, id: aId })
      } else {
        res.state.address = ab2str(res.state.address)
        res.state.balance /= 100000000
        Session.set('address', res)
      }
    })
  }
  Meteor.call('QRLvalue', (err, res) => {
    if (err) {
      Session.set('qrl', 'Error getting value from API')
    } else {
      Session.set('qrl', res)
    }
  })
}

Template.address.onCreated(() => {
  Session.set('address', {})
  Session.set('addressTransactions', {})
  Session.set('qrl', 0)
  Session.set('fetchedTx', false)
  renderAddressBlock()
})

Template.address.helpers({
  address() {
    return Session.get('address')
  },
  QRtext() {
    return FlowRouter.getParam('aId')
  },
  ts() {
    let x = ''
    if (moment.unix(this.timestamp).isValid()) {
      x = moment.unix(this.timestamp)
    }
    return x
  },
  qrl() {
    const address = Session.get('address')
    try {
      const value = address.state.balance
      const x = Session.get('qrl')
      return Math.round((x * value) * 100) / 100
    } catch (e) {
      return 0
    }
  },
})

Template.address.events({
  'click .refresh': () => {
    Session.set('address', {})
    renderAddressBlock()
  },
  'click .close': () => {
    $('.message').hide()
  },
  'click #ShowTx': () => {
    $('table').show()
    const x = Session.get('fetchedTx')
    if (x === false) {
      const tx = Session.get('address').state.transactions
      Meteor.call('addressTransactions', tx, (err, res) => {
        if (err) {
          Session.set('addressTransactions', { error: err })
        } else {
          Session.set('addressTransactions', res)
          $('.loader').hide()
          Session.set('fetchedTx', true)
        }
      })
    }
    $('#ShowTx').hide()
    $('#HideTx').show()
  },
  'click #HideTx': () => {
    $('table').hide()
    $('.loader').hide()
    $('#ShowTx').show()
    $('#HideTx').hide()
  },
})

Template.address.onRendered(() => {
  this.$('.value').popup()
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    Session.set('address', {})
    Session.set('addressTransactions', {})
    Session.set('qrl', 0)
    Session.set('fetchedTx', false)
    renderAddressBlock()
  })
})
