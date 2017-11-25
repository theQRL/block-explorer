/* eslint no-console: 0 */
Meteor.call('getStats', (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})

let req = {
  query: Buffer.from('63e4fc9803fb0c44d98dbff04f54ca2592e4faa9964bac2ed4f5715fc753c54a', 'hex'),
}
console.log(req)
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

req = { filter: 'TRANSACTIONS', offset: 0, quantity: 5 }
Meteor.call('getLatestData', req, (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})

req = {
  address: Buffer.from('Qa02d909723512ecd1606c96f52f5a4121946f068986e612a57c75353952ab3624ddd0bd6', 'ascii'),
}
Meteor.call('getAddressState', req, (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})
