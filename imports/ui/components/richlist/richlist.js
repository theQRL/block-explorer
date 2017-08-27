import './richlist.html'

Template.richlist.onCreated(() => {
  Session.set('richlist', {})
  Meteor.call('richlist', (err, res) => {
    if (err) {
      Session.set('richlist', { error: err })
    } else {
      const op = {
        first: {
          address: res.richlist[1].address,
          balance: res.richlist[1].balance,
        },
        second: {
          address: res.richlist[2].address,
          balance: res.richlist[2].balance,
        },
        third: {
          address: res.richlist[3].address,
          balance: res.richlist[3].balance,
        },
        fourth: {
          address: res.richlist[4].address,
          balance: res.richlist[4].balance,
        },
        fifth: {
          address: res.richlist[5].address,
          balance: res.richlist[5].balance,
        },
      }
      Session.set('richlist', op)
    }
  })
})

Template.richlist.helpers({
  richlist() {
    return Session.get('richlist')
  },
})

Template.richlist.events({
  'click .refresh': () => {
    Session.set('richlist', {})
    Meteor.call('richlist', (err, res) => {
      if (err) {
        Session.set('richlist', { error: err })
      } else {
        const op = {
          first: {
            address: res.richlist[1].address,
            balance: res.richlist[1].balance,
          },
          second: {
            address: res.richlist[2].address,
            balance: res.richlist[2].balance,
          },
          third: {
            address: res.richlist[3].address,
            balance: res.richlist[3].balance,
          },
          fourth: {
            address: res.richlist[4].address,
            balance: res.richlist[4].balance,
          },
          fifth: {
            address: res.richlist[5].address,
            balance: res.richlist[5].balance,
          },
        }
        Session.set('richlist', op)
      }
    })
  },
  'click .close': () => {
    $('.message').hide()
  },
})
