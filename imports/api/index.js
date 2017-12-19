// Server side cache

import { Mongo } from 'meteor/mongo'

export const Addresses = new Mongo.Collection('a')
export const Transactions = new Mongo.Collection('tx')
