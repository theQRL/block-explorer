/* eslint no-underscore-dangle: 0 */

import { check } from 'meteor/check'

import {
  txs, accounts, blocks, transferTxs, coinBaseTxs, tokenTxs, transferTokenTxs, messageTxs,
} from '../imports/collections.js'

import {
  toHexString, fromHexString, toLongString, toTextString, hexToString, toLongStringFromUInt32,
} from '../imports/functions.js'

// *** TODO: MUST BE false IN PRODUCTION
// add a delay in returning data to client to test loading progress UI
const ADD_DATA_RETURN_DELAY = false
// ^^^

const verifyDBConnection = () => !(process.env.MONGO_URL.substr(process.env.MONGO_URL.length - 7) === '/meteor')

const sleepFor = (sleepDuration) => {
  const now = new Date().getTime()
  while (new Date().getTime() < now + sleepDuration) { } // eslint-disable-line
}

const processTx = (input) => {
  let result = input
  // get additional data depending on transaction type
  if (result.transaction_type === 0) {
    // coinbase
    const additionalResult = coinBaseTxs.findOne({ transaction_hash: result.transaction_hash })
    if (additionalResult) {
      if (additionalResult.transaction_hash) {
        additionalResult.transaction_hash = toHexString(additionalResult.transaction_hash)
      }
      if (additionalResult.address_to) {
        additionalResult.address_to = toHexString(additionalResult.address_to)
      }
      if (additionalResult.amount.low_) {
        additionalResult.amount = toLongString(additionalResult.amount.low_, additionalResult.amount.high_)
      }
      result.address_to = additionalResult.address_to
      result.amount = additionalResult.amount
      result.type = 'COINBASE'
    }
  }
  if (result.transaction_type === 1) {
    // transfer
    const additionalResult = transferTxs.findOne({ transaction_hash: result.transaction_hash })
    if (additionalResult) {
      if (additionalResult.addresses_to) {
        for (let i = 0; i < additionalResult.addresses_to.length; i += 1) {
          additionalResult.addresses_to[i] = toHexString(additionalResult.addresses_to[i])
        }
      }
      result.addresses_to = additionalResult.addresses_to
      result.amounts = additionalResult.amounts
      result.type = 'TRANSFER'
    }
  }
  if (result.transaction_type === 2) {
    // create token
    const additionalResult = tokenTxs.findOne({ transaction_hash: result.transaction_hash })
    if (additionalResult) {
      if (additionalResult.transaction_hash) {
        additionalResult.transaction_hash = toHexString(additionalResult.transaction_hash)
      }
      if (additionalResult.name) {
        additionalResult.name = toTextString(additionalResult.name)
      }
      if (additionalResult.owner) {
        additionalResult.owner = toHexString(additionalResult.owner)
      }
      if (additionalResult.symbol) {
        additionalResult.symbol = toTextString(additionalResult.symbol)
      }
      if (additionalResult.addresses_to) {
        for (let i = 0; i < additionalResult.addresses_to.length; i += 1) {
          additionalResult.addresses_to[i] = toHexString(additionalResult.addresses_to[i])
        }
      }
      if (additionalResult.amounts) {
        for (let i = 0; i < additionalResult.amounts.length; i += 1) {
          if (additionalResult.amounts[i].low_) {
            additionalResult.amounts[i] = toLongString(additionalResult.amounts[i].low_, additionalResult.amounts[i].high_)
          }
        }
      }
      result.addresses_to = additionalResult.addresses_to
      result.amounts = additionalResult.amounts
      result.name = additionalResult.name
      result.symbol = additionalResult.symbol
      result.owner = additionalResult.owner
      result.type = 'TOKEN_CREATE'
    }
  }

  if (result.transaction_type === 3) {
    // transfer token
    const additionalResult = transferTokenTxs.findOne({ transaction_hash: result.transaction_hash })
    if (additionalResult) {
      if (additionalResult.transaction_hash) {
        additionalResult.transaction_hash = toHexString(additionalResult.transaction_hash)
      }
      if (additionalResult.token_txn_hash) {
        additionalResult.token_txn_hash = toHexString(additionalResult.token_txn_hash)
      }
      if (additionalResult.addresses_to) {
        for (let i = 0; i < additionalResult.addresses_to.length; i += 1) {
          additionalResult.addresses_to[i] = toHexString(additionalResult.addresses_to[i])
        }
      }
      result.addresses_to = additionalResult.addresses_to
      result.amounts = additionalResult.amounts
      result.token_txn_hash = additionalResult.token_txn_hash
      result.type = 'TOKEN_TRANSFER'
      const symbol = tokenTxs.findOne({ transaction_hash: fromHexString(result.token_txn_hash) })
      result.symbol = toTextString(symbol.symbol)
    }
  }

  if (result.transaction_type === 4) {
    const additionalResult = messageTxs.findOne({ transaction_hash: result.transaction_hash })
    if (additionalResult) {
      if (additionalResult.transaction_hash) {
        additionalResult.transaction_hash = toHexString(additionalResult.transaction_hash)
      }
      if (additionalResult.message_hash) {
        additionalResult.message_hash = toHexString(additionalResult.message_hash)
      }
      if (additionalResult.message_hash.substring(0, 4) === 'afaf') {
        // Found encoded message
        const messageType = additionalResult.message_hash.substring(4, 5)

        // Document Notarisation
        if (messageType === 'a') {
          additionalResult.type = 'DOCUMENT_NOTARISATION'
          const hashType = additionalResult.message_hash.substring(5, 6)
          // SHA1
          if (hashType === '1') {
            additionalResult.file_hash = additionalResult.message_hash.substring(6, 46)
            additionalResult.message = hexToString(additionalResult.message_hash.substring(46))
            additionalResult.hash_function = 'SHA1'
            // SHA256
          } else if (hashType === '2') {
            additionalResult.file_hash = additionalResult.message_hash.substring(6, 70)
            additionalResult.message = hexToString(additionalResult.message_hash.substring(70))
            additionalResult.hash_function = 'SHA256'
            // MD5
          } else if (hashType === '3') {
            additionalResult.file_hash = additionalResult.message_hash.substring(6, 38)
            additionalResult.message = hexToString(additionalResult.message_hash.substring(38))
            additionalResult.hash_function = 'MD5'
          }
        }
      }
      if (additionalResult.message_hash.substring(0, 8) === '0f0f0002') {
        const x = Buffer.from(additionalResult.message_hash, 'hex')
        let kbType = 'error'
        if (additionalResult.message_hash.substring(8, 10) === 'af') { kbType = 'remove' }
        if (additionalResult.message_hash.substring(8, 10) === 'aa') { kbType = 'add' }
        let kbUser = ''
        let spaceIndex = 0
        for (let i = 12; i < additionalResult.message_hash.length; i += 2) {
          if (additionalResult.message_hash.substring(i, i + 2) === '20' && spaceIndex === 0) { spaceIndex = i }
        }

        kbUser = hexToString(additionalResult.message_hash.substring(12, spaceIndex))
        let kbHex = x.slice(spaceIndex, x.length)
        kbHex = kbHex.toString('hex')

        // Found encoded message

        additionalResult.type = 'KEYBASE'
        additionalResult.keybaseUser = kbUser
        additionalResult.keybaseType = kbType
        additionalResult.keybaseHex = kbHex
      }
      if (!additionalResult.type) {
        additionalResult.type = 'MESSAGE'
        additionalResult.message = hexToString(additionalResult.message_hash)
      }
      delete additionalResult.transaction_hash
      result = { ...result, ...additionalResult }
    }
  }

  if (result.transaction_type === 5) {
    result.type = 'SLAVE'
  }

  if (result.transaction_hash) {
    result.transaction_hash = toHexString(result.transaction_hash)
  }
  if (result.address_from) {
    result.address_from = toHexString(result.address_from)
  }
  if (result.master_address) {
    result.master_address = toHexString(result.master_address)
  }
  if (result.public_key) {
    result.public_key = toHexString(result.public_key)
  }
  if (result.signature) {
    result.signature = toHexString(result.signature)
  }
  delete result._id
  return result
}

Meteor.methods({
  tx(txId) {
    check(txId, String)
    if (!verifyDBConnection()) {
      return { found: false, error: 'No database connection' }
    }
    let result = txs.findOne({ transaction_hash: fromHexString(txId) })
    if (ADD_DATA_RETURN_DELAY === true) { sleepFor(2000) }
    if (result) {
      result = processTx(result)
      return result
    }
    return { found: false, error: 'Not found' }
  },

  address(address) {
    check(address, String)
    let noQaddress = address
    if (address.substr(0, 1).toUpperCase() === 'Q') {
      noQaddress = address.substr(1, address.length - 1)
    }
    if (!verifyDBConnection()) {
      return { found: false, error: 'No database connection' }
    }
    const result = accounts.findOne({ address: fromHexString(noQaddress) })
    if (ADD_DATA_RETURN_DELAY === true) { sleepFor(2000) }
    if (result) {
      if (result.address) {
        result.address = `Q${toHexString(result.address)}`
      }
      delete result._id
      return result
    }
    return { found: false, error: 'Not found' }
  },

  block(block) {
    check(block, String)
    if (!verifyDBConnection()) {
      return { found: false, error: 'No database connection' }
    }
    const result = blocks.findOne({ block_number: parseInt(block, 10) })
    if (ADD_DATA_RETURN_DELAY === true) { sleepFor(2000) }
    if (result) {
      if (result.header_hash) {
        result.header_hash = toHexString(result.header_hash)
      }
      if (result.prev_header_hash) {
        result.prev_header_hash = toHexString(result.prev_header_hash)
      }
      if (result.merkle_root) {
        result.merkle_root = toHexString(result.merkle_root)
      }
      if (result.block_reward.low_) {
        result.block_reward = toLongString(result.block_reward.low_, result.block_reward.high_)
      }
      if (result.extra_nonce._bsontype === 'Long') {
        result.extra_nonce = toLongString(result.extra_nonce.low_, result.extra_nonce.high_)
      }
      if (result.mining_nonce) {
        result.mining_nonce = toLongStringFromUInt32(result.mining_nonce)
      }
      const additionalResult = txs.find({ block_number: parseInt(block, 10) }).fetch()
      const blockTransactions = []
      additionalResult.forEach(e => blockTransactions.push(processTx(e)))
      result.transactions = blockTransactions
      delete result._id
      return result
    }
    return { found: false, error: 'Not found' }
  },

  transfer(txId) {
    check(txId, String)
    if (!verifyDBConnection()) {
      return { found: false, error: 'No database connection' }
    }
    const result = transferTxs.findOne({ transaction_hash: fromHexString(txId) })
    if (ADD_DATA_RETURN_DELAY === true) { sleepFor(2000) }
    if (result) {
      if (result.transaction_hash) {
        result.transaction_hash = toHexString(result.transaction_hash)
      }
      if (result.addresses_to) {
        for (let i = 0; i < result.addresses_to.length; i += 1) {
          result.addresses_to[i] = toHexString(result.addresses_to[i])
        }
      }
      result.type = 'TRANSFER'
      delete result._id
      return result
    }
    return { found: false, error: 'Not found' }
  },

  coinbase(txId) {
    check(txId, String)
    if (!verifyDBConnection()) {
      return { found: false, error: 'No database connection' }
    }
    const result = coinBaseTxs.findOne({ transaction_hash: fromHexString(txId) })
    if (result) {
      if (result.transaction_hash) {
        result.transaction_hash = toHexString(result.transaction_hash)
      }
      if (result.address_to) {
        result.address_to = toHexString(result.address_to)
      }
      if (result.amount.low_) {
        result.amount = toLongString(result.amount.low_, result.amount.high_)
      }
      result.type = 'COINBASE'
      delete result._id
      return result
    }
    return { found: false, error: 'Not found' }
  },

  createToken(txId) {
    check(txId, String)
    if (!verifyDBConnection()) {
      return { found: false, error: 'No database connection' }
    }
    const result = tokenTxs.findOne({ transaction_hash: fromHexString(txId) })
    if (result) {
      if (result.transaction_hash) {
        result.transaction_hash = toHexString(result.transaction_hash)
      }
      if (result.name) {
        result.name = toTextString(result.name)
      }
      if (result.owner) {
        result.owner = toHexString(result.owner)
      }
      if (result.symbol) {
        result.symbol = toTextString(result.symbol)
      }
      if (result.addresses_to) {
        for (let i = 0; i < result.addresses_to.length; i += 1) {
          result.addresses_to[i] = toHexString(result.addresses_to[i])
        }
      }
      if (result.amounts) {
        for (let i = 0; i < result.amounts.length; i += 1) {
          if (result.amounts[i].low_) {
            result.amounts[i] = toLongString(result.amounts[i].low_, result.amounts[i].high_)
          }
        }
      }
      result.type = 'TOKEN_CREATE'
      delete result._id
      return result
    }
    return { found: false, error: 'Not found' }
  },

  transferToken(txId) {
    check(txId, String)
    if (!verifyDBConnection()) {
      return { found: false, error: 'No database connection' }
    }
    const result = transferTokenTxs.findOne({ transaction_hash: fromHexString(txId) })
    if (result) {
      if (result.transaction_hash) {
        result.transaction_hash = toHexString(result.transaction_hash)
      }
      if (result.token_txn_hash) {
        result.token_txn_hash = toHexString(result.token_txn_hash)
      }
      if (result.addresses_to) {
        for (let i = 0; i < result.addresses_to.length; i += 1) {
          result.addresses_to[i] = toHexString(result.addresses_to[i])
        }
      }
      result.type = 'TOKEN_TRANSFER'
      delete result._id
      return result
    }
    return { found: false, error: 'Not found' }
  },

  messageTx(txId) {
    check(txId, String)
    if (!verifyDBConnection()) {
      return { found: false, error: 'No database connection' }
    }
    const result = messageTxs.findOne({ transaction_hash: fromHexString(txId) })
    if (result) {
      if (result.transaction_hash) {
        result.transaction_hash = toHexString(result.transaction_hash)
      }
      if (result.message_hash) {
        result.message_hash = toHexString(result.message_hash)
      }
      if (result.message_hash.substring(0, 4) === 'afaf') {
        // Found encoded message
        const messageType = result.message_hash.substring(4, 5)

        // Document Notarisation
        if (messageType === 'a') {
          result.type = 'DOCUMENT_NOTARISATION'
          const hashType = result.message_hash.substring(5, 6)
          // SHA1
          if (hashType === '1') {
            result.file_hash = result.message_hash.substring(6, 46)
            result.message = hexToString(result.message_hash.substring(46))
            result.hash_function = 'SHA1'
            // SHA256
          } else if (hashType === '2') {
            result.file_hash = result.message_hash.substring(6, 70)
            result.message = hexToString(result.message_hash.substring(70))
            result.hash_function = 'SHA256'
            // MD5
          } else if (hashType === '3') {
            result.file_hash = result.message_hash.substring(6, 38)
            result.message = hexToString(result.message_hash.substring(38))
            result.hash_function = 'MD5'
          }
        }
      }
      if (result.message_hash.substring(0, 8) === '0f0f0002') {
        const x = Buffer.from(result.message_hash, 'hex')
        let kbType = 'error'
        if (result.message_hash.substring(8, 10) === 'af') { kbType = 'remove' }
        if (result.message_hash.substring(8, 10) === 'aa') { kbType = 'add' }
        let kbUser = ''
        let spaceIndex = 0
        for (let i = 12; i < result.message_hash.length; i += 2) {
          if (result.message_hash.substring(i, i + 2) === '20' && spaceIndex === 0) { spaceIndex = i }
        }

        kbUser = hexToString(result.message_hash.substring(12, spaceIndex))
        let kbHex = x.slice(spaceIndex, x.length)
        kbHex = kbHex.toString('hex')

        // Found encoded message

        result.type = 'KEYBASE'
        result.keybaseUser = kbUser
        result.keybaseType = kbType
        result.keybaseHex = kbHex
      }
      if (!result.type) {
        result.type = 'MESSAGE'
        result.message = hexToString(result.message_hash)
      }
      delete result._id
      return result
    }
    return { found: false, error: 'Not found' }
  },

})
