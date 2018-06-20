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

if (Meteor.isServer) {
  // This code only runs on the server
  // empty cache of each collection on startup in case of breaking gRPC changes
  Blocks.remove({})
  lasttx.remove({})
  homechart.remove({})
  quantausd.remove({})
  status.remove({})
  peerstats.remove({})

  // then publish collections
  Meteor.publish('blocks', () => Blocks.find())
  Meteor.publish('lasttx', () => lasttx.find())
  Meteor.publish('homechart', () => homechart.find())
  Meteor.publish('quantausd', () => quantausd.find())
  Meteor.publish('status', () => status.find())
  Meteor.publish('peerstats', () => peerstats.find())
}
