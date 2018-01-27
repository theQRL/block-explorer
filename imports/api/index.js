// Server side cache

import { Mongo } from 'meteor/mongo'

export const Addresses = new Mongo.Collection('a')
export const Transactions = new Mongo.Collection('tx')
export const Blocks = new Mongo.Collection('blocks')

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('blocks', function blocksPublication() { // eslint-disable-line prefer-arrow-callback
    return Blocks.find()
  })
}
