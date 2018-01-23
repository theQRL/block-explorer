import { getLatestData } from '/imports/startup/server/index.js'
import { Blocks } from '/imports/api/index.js'

Meteor.setInterval(() => {
  const request = { filter: 'BLOCKHEADERS', offset: 0, quantity: 5 }
  const response = Meteor.wrapAsync(getLatestData)(request)
  Blocks.remove({})
  Blocks.insert(response)
}, 20000)
