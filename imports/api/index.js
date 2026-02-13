// Server side cache
import { Mongo } from 'meteor/mongo'

export const Addresses = new Mongo.Collection('a')
export const Transactions = new Mongo.Collection('tx')
export const Blocks = new Mongo.Collection('blocks')
export const lasttx = new Mongo.Collection('lasttx')
export const homechart = new Mongo.Collection('homechart')
export const quantausd = new Mongo.Collection('quantausd')
export const status = new Mongo.Collection('status')
export const peerstats = new Mongo.Collection('peerstats')
export const blockData = new Mongo.Collection('blockdata')

if (Meteor.isServer) {
  // This code only runs on the server
  // Empty cache of each collection on startup in case of breaking gRPC changes,
  // then register publications after cleanup completes or is handled.
  (async () => {
    try {
      await Promise.all([
        Blocks.removeAsync({}),
        lasttx.removeAsync({}),
        homechart.removeAsync({}),
        quantausd.removeAsync({}),
        status.removeAsync({}),
        peerstats.removeAsync({}),
      ])
    } catch (error) {
      Meteor._debug('Cache cleanup error during startup:', error.message || error.reason || error) // eslint-disable-line no-underscore-dangle
    }

    Meteor.publish('blocks', () => Blocks.find())
    Meteor.publish('lasttx', () => lasttx.find())
    Meteor.publish('homechart', () => homechart.find())
    Meteor.publish('quantausd', () => quantausd.find())
    Meteor.publish('status', () => status.find())
    Meteor.publish('peerstats', () => peerstats.find())
  })()
}

if (Meteor.isClient) {
  status.find({}).observe({
    added: (doc) => {
      Session.set('explorer-status', doc)
    },
  })
}
