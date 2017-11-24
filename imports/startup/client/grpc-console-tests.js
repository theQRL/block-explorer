/* eslint no-console: 0 */
Meteor.call('getStats', (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})

let req = {
  block: 5,
}
Meteor.call('getObject', req, (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})

req = { filter: 'BLOCKHEADERS', offset: 0, quantity: 5 }
Meteor.call('getLatestData', req, (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})

req = {
  address: 'Qa02d909723512ecd1606c96f52f5a4121946f068986e612a57c75353952ab3624ddd0bd6',
}
Meteor.call('getAddressState', req, (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})
