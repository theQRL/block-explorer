// Import client startup through a single index entry point

import './routes.js'

Meteor.call('getStats', (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})

const req = { block: 444 }
Meteor.call('getObject', req, (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})