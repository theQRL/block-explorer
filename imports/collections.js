import { Mongo } from 'meteor/mongo'

export const accounts = new Mongo.Collection('accounts')
export const blocks = new Mongo.Collection('blocks')
export const coinBaseTxs = new Mongo.Collection('coin_base_txs')
export const messageTxs = new Mongo.Collection('message_txs')
export const quantaUsd = new Mongo.Collection('quantausd')
export const slaveTxs = new Mongo.Collection('slave_txs')
export const tokenTxs = new Mongo.Collection('token_txs')
export const transferTokenTxs = new Mongo.Collection('transfer_token_txs')
export const transferTxs = new Mongo.Collection('transfer_txs')
export const txs = new Mongo.Collection('txs')
