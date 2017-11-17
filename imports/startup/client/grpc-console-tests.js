/* eslint no-console: 0 */
Meteor.call('getStats', (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})

let req = {}
Meteor.call('getObject', req, (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})

req = {}
Meteor.call('getLatestData', req, (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})

req = {
  address: 'UTFjYWE2YTM1N2Y2YjU2ODQxMzEyNDNmYjdjYjIzMzFlYTZlNTUwMzk2NTVhMzY2YjUzYmM0NzlkYTJkNWM0NTFhMGEzNzVjYw==',
}
Meteor.call('getAddressState', req, (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})
