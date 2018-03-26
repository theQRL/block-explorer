/* eslint no-console: 0 */
// server-side startup
import grpc from 'grpc'
import tmp from 'tmp'
import fs from 'fs'
import { check } from 'meteor/check'
import '/imports/api/index.js'
import '/imports/startup/server/cron.js'

const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

// The address of the API node used

// defaults to Testnet if run without config file
let API_NODE_ADDRESS = '35.177.60.137:9009' // Testnet
// let API_NODE_ADDRESS = '35.177.114.111:9009' // Devnet
try {
  if (Meteor.settings.api.node.length > 0) {
    API_NODE_ADDRESS = Meteor.settings.api.node
  }
} catch (e) {
  // no configuration file used
}

// Create a temp file to store the qrl.proto file in
let qrlProtoFilePath = tmp.fileSync({ mode: '0644', prefix: 'qrl-', postfix: '.proto' }).name
let qrlClient = []

// Load qrlbase.proto and fetch current qrl.proto from node
let baseGrpcObject = grpc.load(Assets.absoluteFilePath('qrlbase.proto'))
let client = new baseGrpcObject.qrl.Base(API_NODE_ADDRESS, grpc.credentials.createInsecure())

client.getNodeInfo({}, (err, res) => {
  if (err) {
    console.log(`Error fetching qrl.proto from ${API_NODE_ADDRESS}`)
  } else {
    fs.writeFile(qrlProtoFilePath, res.grpcProto, (FSerr) => {
      if (FSerr) throw FSerr
      const grpcObject = grpc.load(qrlProtoFilePath)
      // Create area to store this grpc connection
      qrlClient.push('API')
      qrlClient.API = new grpcObject.qrl
        .PublicAPI(API_NODE_ADDRESS, grpc.credentials.createInsecure())
      console.log(`qrlClient.API loaded for ${API_NODE_ADDRESS}`)
    })
  }
})

const errorCallback = (error, message, alert) => {
  const d = new Date()
  const getTime = d.toUTCString()
  console.log(`${alert} [Timestamp: ${getTime}] ${error}`)
  const meteorError = new Meteor.Error(500, `[${getTime}] ${message} (${error})`)
  return meteorError
}

const getAddressState = (request, callback) => {
  if (qrlClient.length !== 0) {
    try {
      qrlClient.API.GetAddressState(request, (error, response) => {
        if (error) {
          const myError = errorCallback(error, 'Cannot access API/GetAddressState', '**ERROR/getAddressState** ')
          callback(myError, null)
        } else {
          // server side buffering being added here
          // if (!(Addresses.findOne({ Address: response.state.address }))) {
          //   console.log('Going to add this one...')
          //   Addresses.insert({ Address: response.state.address })
          // }
          callback(null, response)
        }
      })
    } catch (error) {
      const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/getObject**')
      callback(myError, null)
    }
  } else {
    const myError = errorCallback('The block explorer server cannot connect to the API node', 'Cannot access API/GetStats/b', '**ERROR/getStats/b**')
    callback(myError, null)
  }
}

export const getLatestData = (request, callback) => {
  if (qrlClient.length !== 0) {
    try {
      qrlClient.API.GetLatestData(request, (error, response) => {
        if (error) {
          const myError = errorCallback(error, 'Cannot access API/GetLatestData', '**ERROR/getLatestData** ')
          callback(myError, null)
        } else {
          callback(null, response)
        }
      })
    } catch (error) {
      const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/getObject**')
      callback(myError, null)
    }
  } else {
    const myError = errorCallback('The block explorer server cannot connect to the API node', 'Cannot access API/GetStats/b', '**ERROR/getStats/b**')
    callback(myError, null)
  }
}

export const getStats = (request, callback) => {
  if (qrlClient.length !== 0) {
    try {
      qrlClient.API.GetStats(request, (error, response) => {
        if (error) {
          const myError = errorCallback(error, 'Cannot access API/GetStats/a', '**ERROR/getStats/a** ')
          callback(myError, null)
        } else {
          callback(null, response)
        }
      })
    } catch (error) {
      const myError = errorCallback(error, 'Cannot access API/GetStats/b', '**ERROR/getStats/b**')
      callback(myError, null)
    }
  } else {
    const myError = errorCallback('The block explorer server cannot connect to the API node', 'Cannot access API/GetStats/b', '**ERROR/getStats/b**')
    callback(myError, null)
  }
}

const getStakers = (request, callback) => {
  if (qrlClient.length !== 0) {
    try {
      qrlClient.API.GetStakers(request, (error, response) => {
        if (error) {
          const myError = errorCallback(error, 'Cannot access API/GetStakers', '**ERROR/getStakers** ')
          callback(myError, null)
        } else {
          const currentStakers = []
          response.stakers.forEach((staker) => {
            currentStakers.push({
              address: ab2str(staker.address_state.address),
              balance: staker.address_state.balance / SHOR_PER_QUANTA,
              nonce: staker.address_state.nonce,
              hash_terminator: staker.terminator_hash.toString('hex'),
            })
          })
          callback(null, currentStakers)
        }
      })
    } catch (error) {
      const myError = errorCallback(error, 'Cannot access API/GetStakers', '**ERROR/getStakers**')
      callback(myError, null)
    }
  } else {
    const myError = errorCallback('The block explorer server cannot connect to the API node', 'Cannot access API/GetStats/b', '**ERROR/getStats/b**')
    callback(myError, null)
  }
}

export const getObject = (request, callback) => {
  if (qrlClient.length !== 0) {
    try {
      qrlClient.API.GetObject(request, (error, response) => {
        if (error) {
          const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/getObject**')
          callback(myError, null)
        } else {
          // console.log(response)
          callback(null, response)
        }
      })
    } catch (error) {
      const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/getObject**')
      callback(myError, null)
    }
  } else {
    const myError = errorCallback('The block explorer server cannot connect to the API node', 'Cannot access API/GetStats/b', '**ERROR/getStats/b**')
    callback(myError, null)
  }
}

export const apiCall = (apiUrl, callback) => {
  try {
    const response = HTTP.get(apiUrl).data
    // Successful call
    callback(null, response)
  } catch (error) {
    const myError = new Meteor.Error(500, 'Cannot access the API')
    callback(myError, null)
  }
}

Meteor.methods({
  QRLvalue() {
    this.unblock()
    const apiUrl = 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=btc-qrl'
    const apiUrlUSD = 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=usdt-btc'
    // asynchronous call to API
    const response = Meteor.wrapAsync(apiCall)(apiUrl)
    const responseUSD = Meteor.wrapAsync(apiCall)(apiUrlUSD)
    const usd = response.result[0].Last * responseUSD.result[0].Last
    return usd
  },

  status() {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const response = Meteor.wrapAsync(getStats)({})
    return response
  },

  lastblocks() {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const response = Meteor.wrapAsync(getLatestData)({ filter: 'BLOCKHEADERS', offset: 0, quantity: 5 })
    return response
  },

  lastunconfirmedtx() {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const unconfirmed = Meteor.wrapAsync(getLatestData)({ filter: 'TRANSACTIONS_UNCONFIRMED', offset: 0, quantity: 5 })
    
    unconfirmed.transactions_unconfirmed.forEach (function (item, index) {
      unconfirmed.transactions_unconfirmed[index].tx.confirmed = 'false'
      if (item.tx.transactionType === 'token') {
        // Store plain text version of token symbol
        unconfirmed.transactions_unconfirmed[index].tx.tokenSymbol =
          Buffer.from(item.tx.token.symbol).toString()
      } else if (item.tx.transactionType === 'transfer_token') {
        // Request Token Symbol
        const symbolRequest = {
          query: Buffer.from(item.tx.transfer_token.token_txhash, 'hex'),
        }
        const thisSymbolResponse = Meteor.wrapAsync(getObject)(symbolRequest)
        // Store symbol in unconfirmed
        unconfirmed.transactions_unconfirmed[index].tx.tokenSymbol =
          Buffer.from(thisSymbolResponse.transaction.tx.token.symbol).toString()
        unconfirmed.transactions_unconfirmed[index].tx.tokenDecimals = 
            thisSymbolResponse.transaction.tx.token.decimals

        // Calculate total transferred
        let thisTotalTransferred = 0
        _.each(unconfirmed.transactions_unconfirmed[index].tx.transfer_token.addrs_to, (thisAddress, aindex) => {
          // Now update total transferred with the corresponding amount from this output
          thisTotalTransferred += parseInt(unconfirmed.transactions_unconfirmed[index].tx.transfer_token.amounts[aindex])
        })
        thisTotalTransferred = thisTotalTransferred / Math.pow(10, thisSymbolResponse.transaction.tx.token.decimals)
        unconfirmed.transactions_unconfirmed[index].tx.totalTransferred = thisTotalTransferred
      } else if (item.tx.transactionType === 'transfer') {
        // Calculate total transferred
        let thisTotalTransferred = 0
        _.each(unconfirmed.transactions_unconfirmed[index].tx.transfer.addrs_to, (thisAddress, aindex) => {
          // Now update total transferred with the corresponding amount from this output
          thisTotalTransferred += parseInt(unconfirmed.transactions_unconfirmed[index].tx.transfer.amounts[aindex])
        })
        thisTotalTransferred = thisTotalTransferred / SHOR_PER_QUANTA
        unconfirmed.transactions_unconfirmed[index].tx.totalTransferred = thisTotalTransferred
      }
    })
    return unconfirmed
  },

  txhash(txId) {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    check(txId, String)
    if (!((Match.test(txId, String)) && (txId.length === 64))) {
      const errorCode = 400
      const errorMessage = 'Badly formed transaction ID'
      throw new Meteor.Error(errorCode, errorMessage)
    } else {
      // asynchronous call to API
      const req = { query: Buffer.from(txId, 'hex') }
      const response = Meteor.wrapAsync(getObject)(req)

      // refactor response data
      const output = response
      if (response.transaction.header) {
        output.transaction.header.hash_header = Buffer.from(output.transaction.header.hash_header).toString('hex')
        output.transaction.header.hash_header_prev = Buffer.from(output.transaction.header.hash_header_prev).toString('hex')
        output.transaction.header.merkle_root = Buffer.from(output.transaction.header.merkle_root).toString('hex')

        output.transaction.tx.transaction_hash = Buffer.from(output.transaction.tx.transaction_hash).toString('hex')
        output.transaction.tx.amount = ''

        if (output.transaction.tx.transactionType === 'coinbase') {
          output.transaction.tx.addr_from = 'Q' + Buffer.from(output.transaction.addr_from).toString('hex')
          output.transaction.tx.addr_to = 'Q' + Buffer.from(output.transaction.tx.coinbase.addr_to).toString('hex')
          output.transaction.tx.coinbase.addr_to = 'Q' + Buffer.from(output.transaction.tx.coinbase.addr_to).toString('hex')
          output.transaction.tx.amount = numberToString(output.transaction.tx.coinbase.amount / SHOR_PER_QUANTA)

          output.transaction.explorer = {
            from: '',
            to: output.transaction.tx.addr_to,
            type: 'COINBASE',
          }
        }
      } else {
        output.transaction.tx.transaction_hash = Buffer.from(output.transaction.tx.transaction_hash).toString('hex')
      }

      if (output.transaction.tx.transactionType === 'token') {
        const balances = []
        output.transaction.tx.token.initial_balances.forEach((value) => {
          const edit = value
          edit.address = 'Q' + Buffer.from(edit.address).toString('hex'),
          edit.amount = numberToString(edit.amount / Math.pow(10, output.transaction.tx.token.decimals))
          balances.push(edit)
        })

        output.transaction.tx.addr_from = 'Q' + Buffer.from(output.transaction.addr_from).toString('hex')
        output.transaction.tx.public_key = Buffer.from(output.transaction.tx.public_key).toString('hex')
        output.transaction.tx.signature = Buffer.from(output.transaction.tx.signature).toString('hex')

        output.transaction.tx.token.symbol = Buffer.from(output.transaction.tx.token.symbol).toString()
        output.transaction.tx.token.name = Buffer.from(output.transaction.tx.token.name).toString()
        output.transaction.tx.token.owner = 'Q' + Buffer.from(output.transaction.tx.token.owner).toString('hex')

        output.transaction.tx.fee = numberToString(output.transaction.tx.fee / SHOR_PER_QUANTA)
        output.transaction.explorer = {
          from: output.transaction.tx.addr_from,
          to: output.transaction.tx.addr_from,
          signature: output.transaction.tx.signature,
          publicKey: output.transaction.tx.public_key,
          symbol: output.transaction.tx.token.symbol,
          name: output.transaction.tx.token.name,
          decimals: output.transaction.tx.token.decimals,
          owner: output.transaction.tx.token.owner,
          initialBalances: balances,
          type: 'CREATE TOKEN',
        }
      }
      
      if (output.transaction.tx.transactionType === 'transfer') {
        // Calculate total transferred, and generate a clean structure to display outputs from
        let thisTotalTransferred = 0
        let thisOutputs = []
        _.each(output.transaction.tx.transfer.addrs_to, (thisAddress, index) => {
          const thisOutput = {
            address: 'Q' + Buffer.from(thisAddress).toString('hex'),
            amount: numberToString(output.transaction.tx.transfer.amounts[index] / SHOR_PER_QUANTA)
          }
          thisOutputs.push(thisOutput)

          // Now update total transferred with the corresponding amount from this output
          thisTotalTransferred += parseInt(output.transaction.tx.transfer.amounts[index])
        })

        output.transaction.tx.addr_from = 'Q' + Buffer.from(output.transaction.addr_from).toString('hex')
        output.transaction.tx.transfer.outputs = thisOutputs
        output.transaction.tx.amount = numberToString(thisTotalTransferred / SHOR_PER_QUANTA)
        output.transaction.tx.fee = numberToString(output.transaction.tx.fee / SHOR_PER_QUANTA)
        output.transaction.tx.public_key = Buffer.from(output.transaction.tx.public_key).toString('hex')
        output.transaction.tx.signature = Buffer.from(output.transaction.tx.signature).toString('hex')
       
        output.transaction.explorer = {
          from: output.transaction.tx.addr_from,
          outputs: thisOutputs,
          totalTransferred: numberToString(thisTotalTransferred / SHOR_PER_QUANTA),
          type: 'TRANSFER',
        }
      }

      if (output.transaction.tx.transactionType === 'transfer_token') {

        // Request Token Decimals / Symbol
        const symbolRequest = {
          query: Buffer.from(output.transaction.tx.transfer_token.token_txhash, 'hex'),
        }
        const thisSymbolResponse = Meteor.wrapAsync(getObject)(symbolRequest)
        const thisSymbol = Buffer.from(thisSymbolResponse.transaction.tx.token.symbol).toString()
        const thisDecimals = thisSymbolResponse.transaction.tx.token.decimals

        // Calculate total transferred, and generate a clean structure to display outputs from
        let thisTotalTransferred = 0
        let thisOutputs = []
        _.each(output.transaction.tx.transfer_token.addrs_to, (thisAddress, index) => {
          const thisOutput = {
            address: 'Q' + Buffer.from(thisAddress).toString('hex'),
            amount: numberToString(output.transaction.tx.transfer_token.amounts[index] / Math.pow(10, thisDecimals))
          }
          thisOutputs.push(thisOutput)

          // Now update total transferred with the corresponding amount from this output
          thisTotalTransferred += parseInt(output.transaction.tx.transfer_token.amounts[index])
        })

        output.transaction.tx.fee = numberToString(output.transaction.tx.fee / SHOR_PER_QUANTA)
        output.transaction.tx.addr_from = 'Q' + Buffer.from(output.transaction.addr_from).toString('hex')
        output.transaction.tx.public_key = Buffer.from(output.transaction.tx.public_key).toString('hex')
        output.transaction.tx.signature = Buffer.from(output.transaction.tx.signature).toString('hex')
        output.transaction.tx.transfer_token.token_txhash = Buffer.from(output.transaction.tx.transfer_token.token_txhash).toString('hex')
        output.transaction.tx.transfer_token.outputs = thisOutputs
        output.transaction.tx.totalTransferred = numberToString(thisTotalTransferred / Math.pow(10, thisDecimals))

        output.transaction.explorer = {
          from: output.transaction.tx.addr_from,
          outputs: thisOutputs,
          signature: output.transaction.tx.signature,
          publicKey: output.transaction.tx.public_key,
          token_txhash: output.transaction.tx.transfer_token.token_txhash,
          totalTransferred: numberToString(thisTotalTransferred / Math.pow(10, thisDecimals)),
          type: 'TRANSFER TOKEN',
        }
      }

      if (output.transaction.tx.transactionType === 'slave') {
        output.transaction.tx.fee = output.transaction.tx.fee / SHOR_PER_QUANTA

        output.transaction.tx.public_key = Buffer.from(output.transaction.tx.public_key).toString('hex')
        output.transaction.tx.signature = Buffer.from(output.transaction.tx.signature).toString('hex')
        output.transaction.tx.addr_from = 'Q' + Buffer.from(output.transaction.addr_from).toString('hex')

        output.transaction.tx.slave.slave_pks.forEach((value, index) => {
          output.transaction.tx.slave.slave_pks[index] = 
            Buffer.from(value).toString('hex')
        })

        output.transaction.explorer = {
          from: output.transaction.tx.addr_from,
          to: '',
          signature: output.transaction.tx.signature,
          publicKey: output.transaction.tx.public_key,
          amount: output.transaction.tx.amount,
          type: 'SLAVE',
        }
      }

      if (output.transaction.tx.transactionType === 'latticePK') {
        output.transaction.tx.fee = output.transaction.tx.fee / SHOR_PER_QUANTA

        output.transaction.tx.public_key = Buffer.from(output.transaction.tx.public_key).toString('hex')
        output.transaction.tx.signature = Buffer.from(output.transaction.tx.signature).toString('hex')
        output.transaction.tx.addr_from = 'Q' + Buffer.from(output.transaction.addr_from).toString('hex')

        output.transaction.tx.latticePK.kyber_pk = Buffer.from(output.transaction.tx.latticePK.kyber_pk).toString('hex')
        output.transaction.tx.latticePK.dilithium_pk = Buffer.from(output.transaction.tx.latticePK.dilithium_pk).toString('hex')

        output.transaction.explorer = {
          from: output.transaction.tx.addr_from,
          to: '',
          signature: output.transaction.tx.signature,
          publicKey: output.transaction.tx.public_key,
          amount: output.transaction.tx.amount,
          type: 'LATTICE PK',
        }
      }
      return output
    }
  },

  block(blockId) {
    check(blockId, Number)
    if (!(Match.test(blockId, Number))) {
      const errorCode = 400
      const errorMessage = 'Invalid block number'
      throw new Meteor.Error(errorCode, errorMessage)
    } else {
      // avoid blocking other method calls from same client - *may need to remove for production*
      this.unblock()
      // asynchronous call to API
      check(blockId, Number)
      const req = {
        query: Buffer.from(blockId.toString()),
      }
      const response = Meteor.wrapAsync(getObject)(req)

      // Refactor for block_extended and extended_transactions
      response.block = response.block_extended
      response.block.transactions = response.block_extended.extended_transactions

      if (response.block.header) {
        response.block.header.hash_header = Buffer.from(response.block.header.hash_header).toString('hex')
        response.block.header.hash_header_prev = Buffer.from(response.block.header.hash_header_prev).toString('hex')
        response.block.header.merkle_root = Buffer.from(response.block.header.merkle_root).toString('hex')

        // transactions
        const transactions = []
        response.block.transactions.forEach((value) => {

          const adjusted = value.tx
          adjusted.addr_from = 'Q' + Buffer.from(value.addr_from).toString('hex')
          adjusted.public_key = Buffer.from(adjusted.public_key).toString('hex')
          adjusted.transaction_hash = Buffer.from(adjusted.transaction_hash).toString('hex')
          adjusted.signature = Buffer.from(adjusted.signature).toString('hex')
          if (adjusted.transactionType === 'coinbase') {
            adjusted.coinbase.addr_to = 'Q' + Buffer.from(adjusted.coinbase.addr_to).toString('hex')
            // FIXME: need to refactor to explorer.[GUI] format (below allow amount to be displayed)
            adjusted.transfer = adjusted.coinbase
          }

          if (adjusted.transactionType === 'transfer') {
            // Calculate total transferred, and generate a clean structure to display outputs from
            let thisTotalTransferred = 0
            let totalOutputs = 0
            _.each(adjusted.transfer.addrs_to, (thisAddress, index) => {
              totalOutputs = totalOutputs + 1
              thisTotalTransferred = thisTotalTransferred + parseInt(adjusted.transfer.amounts[index])
            })
            adjusted.transfer.totalTransferred = thisTotalTransferred / SHOR_PER_QUANTA
            adjusted.transfer.totalOutputs = totalOutputs
          }
          if (adjusted.transactionType === 'transfer_token') {
            // Request Token Decimals / Symbol
            const symbolRequest = {
              query: Buffer.from(adjusted.transfer_token.token_txhash, 'hex'),
            }
            const thisSymbolResponse = Meteor.wrapAsync(getObject)(symbolRequest)

            const thisSymbol = Buffer.from(thisSymbolResponse.transaction.tx.token.symbol).toString()
            const thisDecimals = thisSymbolResponse.transaction.tx.token.decimals

            // Calculate total transferred, and generate a clean structure to display outputs from
            let thisTotalTransferred = 0
            let totalOutputs = 0
            _.each(adjusted.transfer_token.addrs_to, (thisAddress, index) => {
              totalOutputs = totalOutputs + 1
              thisTotalTransferred = thisTotalTransferred + parseInt(adjusted.transfer_token.amounts[index])
            })
            adjusted.transfer_token.totalTransferred = thisTotalTransferred / Math.pow(10, thisDecimals)
            adjusted.transfer_token.totalOutputs = totalOutputs
            adjusted.transfer_token.tokenSymbol = thisSymbol
          }

          transactions.push(adjusted)
        })

        response.block.transactions = transactions
      }
      return response
    }
  },

  addressTransactions(request) {
    check(request, Object)

    const targets = request.tx
    let result = []
    targets.forEach((arr) => {

      const req = { query: Buffer.from(arr.txhash, 'hex') }

      try {
        const thisTxnHashResponse = Meteor.wrapAsync(getObject)(req)

        if (thisTxnHashResponse.found === true && thisTxnHashResponse.result === 'transaction') {

          thisTxnHashResponse.transaction.addr_from =
            'Q' + Buffer.from(thisTxnHashResponse.transaction.addr_from).toString('hex')
          thisTxnHashResponse.transaction.tx.transaction_hash =
            Buffer.from(thisTxnHashResponse.transaction.tx.transaction_hash).toString('hex')
          
          thisTxnHashResponse.transaction.tx.addr_to = ''
          thisTxnHashResponse.transaction.tx.amount = ''

          if (thisTxnHashResponse.transaction.coinbase) {
            thisTxnHashResponse.transaction.tx.addr_to =
              'Q' + Buffer.from(thisTxnHashResponse.transaction.tx.coinbase.addr_to).toString('hex')
            thisTxnHashResponse.transaction.tx.coinbase.addr_to =
              'Q' + Buffer.from(thisTxnHashResponse.transaction.tx.coinbase.addr_to).toString('hex')
            thisTxnHashResponse.transaction.tx.amount = thisTxnHashResponse.transaction.tx.coinbase.amount / SHOR_PER_QUANTA
          }

          thisTxnHashResponse.transaction.tx.public_key = Buffer.from(thisTxnHashResponse.transaction.tx.public_key).toString('hex')
          thisTxnHashResponse.transaction.tx.signature = Buffer.from(thisTxnHashResponse.transaction.tx.signature).toString('hex')
        }

        let thisTxn = {}

        if (thisTxnHashResponse.transaction.tx.transactionType == "transfer") {
          // Calculate total transferred, and generate a clean structure to display outputs from
          let thisTotalTransferred = 0
          let thisOutputs = []
          _.each(thisTxnHashResponse.transaction.tx.transfer.addrs_to, (thisAddress, index) => {
            const thisOutput = {
              address: 'Q' + Buffer.from(thisAddress).toString('hex'),
              amount: numberToString(parseInt(thisTxnHashResponse.transaction.tx.transfer.amounts[index]) / SHOR_PER_QUANTA)
            }
            thisOutputs.push(thisOutput)

            // Now update total transferred with the corresponding amount from this output
            thisTotalTransferred += parseInt(thisTxnHashResponse.transaction.tx.transfer.amounts[index])
          })

          thisTxn = {
            type: thisTxnHashResponse.transaction.tx.transactionType,
            txhash: arr.txhash,
            totalTransferred: numberToString(thisTotalTransferred / SHOR_PER_QUANTA),
            outputs: thisOutputs,
            from: thisTxnHashResponse.transaction.addr_from,
            ots_key: parseInt(thisTxnHashResponse.transaction.tx.signature.substring(0, 8), 16),
            fee: thisTxnHashResponse.transaction.tx.fee / SHOR_PER_QUANTA,
            block: thisTxnHashResponse.transaction.header.block_number,
            timestamp: thisTxnHashResponse.transaction.header.timestamp_seconds,
          }

          result.push(thisTxn)
        } else if (thisTxnHashResponse.transaction.tx.transactionType == "token") {
          thisTxn = {
            type: thisTxnHashResponse.transaction.tx.transactionType,
            txhash: arr.txhash,
            from: thisTxnHashResponse.transaction.addr_from,
            symbol: Buffer.from(thisTxnHashResponse.transaction.tx.token.symbol).toString(),
            name: Buffer.from(thisTxnHashResponse.transaction.tx.token.name).toString(),
            decimals: thisTxnHashResponse.transaction.tx.token.decimals,
            ots_key: parseInt(thisTxnHashResponse.transaction.tx.signature.substring(0, 8), 16),
            fee: thisTxnHashResponse.transaction.tx.fee / SHOR_PER_QUANTA,
            block: thisTxnHashResponse.transaction.header.block_number,
            timestamp: thisTxnHashResponse.transaction.header.timestamp_seconds,
          }

          result.push(thisTxn)
        } else if (thisTxnHashResponse.transaction.tx.transactionType == "transfer_token") {
          // Request Token Symbol
          const symbolRequest = {
            query: Buffer.from(Buffer.from(thisTxnHashResponse.transaction.tx.transfer_token.token_txhash).toString('hex'), 'hex')
          }

          const thisSymbolResponse = Meteor.wrapAsync(getObject)(symbolRequest)
          const thisSymbol = Buffer.from(thisSymbolResponse.transaction.tx.token.symbol).toString()
          const thisDecimals = thisSymbolResponse.transaction.tx.token.decimals

          // Calculate total transferred, and generate a clean structure to display outputs from
          let thisTotalTransferred = 0
          let thisOutputs = []
          _.each(thisTxnHashResponse.transaction.tx.transfer_token.addrs_to, (thisAddress, index) => {
            const thisOutput = {
              address: 'Q' + Buffer.from(thisAddress).toString('hex'),
              amount: numberToString(parseInt(thisTxnHashResponse.transaction.tx.transfer_token.amounts[index]) / Math.pow(10, thisDecimals))
            }
            thisOutputs.push(thisOutput)

            // Now update total transferred with the corresponding amount from this output
            thisTotalTransferred += parseInt(thisTxnHashResponse.transaction.tx.transfer_token.amounts[index])
          })

          thisTxn = {
            type: thisTxnHashResponse.transaction.tx.transactionType,
            txhash: arr.txhash,
            symbol: thisSymbol,
            totalTransferred: numberToString(thisTotalTransferred / Math.pow(10, thisDecimals)),
            outputs: thisOutputs,
            from: thisTxnHashResponse.transaction.addr_from,
            ots_key: parseInt(thisTxnHashResponse.transaction.tx.signature.substring(0, 8), 16),
            fee: thisTxnHashResponse.transaction.tx.fee / SHOR_PER_QUANTA,
            block: thisTxnHashResponse.transaction.header.block_number,
            timestamp: thisTxnHashResponse.transaction.header.timestamp_seconds,
          }

          result.push(thisTxn)
        } else if (thisTxnHashResponse.transaction.tx.transactionType == "coinbase") {
          thisTxn = {
            type: thisTxnHashResponse.transaction.tx.transactionType,
            txhash: arr.txhash,
            amount: numberToString(thisTxnHashResponse.transaction.tx.coinbase.amount / SHOR_PER_QUANTA),
            from: thisTxnHashResponse.transaction.addr_from,
            to: thisTxnHashResponse.transaction.tx.coinbase.addr_to,
            ots_key: "",
            fee: thisTxnHashResponse.transaction.tx.fee / SHOR_PER_QUANTA,
            block: thisTxnHashResponse.transaction.header.block_number,
            timestamp: thisTxnHashResponse.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (thisTxnHashResponse.transaction.tx.transactionType == "slave") {
          thisTxn = {
            type: thisTxnHashResponse.transaction.tx.transactionType,
            txhash: arr.txhash,
            amount: 0,
            from: thisTxnHashResponse.transaction.addr_from,
            to: '',
            ots_key: parseInt(thisTxnHashResponse.transaction.tx.signature.substring(0, 8), 16),
            fee: thisTxnHashResponse.transaction.tx.fee / SHOR_PER_QUANTA,
            block: thisTxnHashResponse.transaction.header.block_number,
            timestamp: thisTxnHashResponse.transaction.header.timestamp_seconds,
          }

          result.push(thisTxn)
        } else if (thisTxnHashResponse.transaction.tx.transactionType == "latticePK") {
          thisTxn = {
            type: thisTxnHashResponse.transaction.tx.transactionType,
            txhash: arr.txhash,
            amount: 0,
            from: thisTxnHashResponse.transaction.addr_from,
            to: '',
            ots_key: parseInt(thisTxnHashResponse.transaction.tx.signature.substring(0, 8), 16),
            fee: thisTxnHashResponse.transaction.tx.fee / SHOR_PER_QUANTA,
            block: thisTxnHashResponse.transaction.header.block_number,
            timestamp: thisTxnHashResponse.transaction.header.timestamp_seconds,
          }

          result.push(thisTxn)
        }

      } catch (err) {
        console.log(`Error fetching transaction hash in addressTransactions '${arr.txhash}' - ${err}`)
      }
    })

    return result
  },

  getStats(request = {}) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getStats)(request)
    return response
  },

  getObject(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getObject)(request)
    return response
  },

  getLatestData(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getLatestData)(request)
    return response
  },

  stakers(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getStakers)(request)
    return response
  },

  getAddressState(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getAddressState)(request)
    return response
  },

  // Switch node --> remove for production
  // cyyber(request) {
  //   check(request, String)
  //   API_NODE_ADDRESS = `${request}:9009`

  //   // Create a temp file to store the qrl.proto file in
  //   qrlProtoFilePath = tmp.fileSync({ mode: '0644', prefix: 'qrl-', postfix: '.proto' }).name
  //   qrlClient = []

  //   // Load qrlbase.proto and fetch current qrl.proto from node
  //   baseGrpcObject = grpc.load(Assets.absoluteFilePath('qrlbase.proto'))
  //   client = new baseGrpcObject.qrl.Base(API_NODE_ADDRESS, grpc.credentials.createInsecure())

  //   client.getNodeInfo({}, (err, res) => {
  //     if (err) {
  //       console.log(`Error fetching qrl.proto from ${API_NODE_ADDRESS}`)
  //     } else {
  //       fs.writeFile(qrlProtoFilePath, res.grpcProto, (FSerr) => {
  //         if (FSerr) throw FSerr
  //         const grpcObject = grpc.load(qrlProtoFilePath)
  //         // Create area to store this grpc connection
  //         qrlClient.push('API')
  //         qrlClient.API = new grpcObject.qrl
  //           .PublicAPI(API_NODE_ADDRESS, grpc.credentials.createInsecure())
  //         console.log(`qrlClient.API loaded for ${API_NODE_ADDRESS}`)
  //       })
  //     }
  //   })
  // },
})
