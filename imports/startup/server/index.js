/* eslint no-console: 0, max-len: 0 */
/* global _ */

// server-side startup
import grpc from '@grpc/grpc-js'
import protoloader from '@grpc/proto-loader'
import tmp from 'tmp'
import fs from 'fs'
import BigNumber from 'bignumber.js'
import helpers from '@theqrl/explorer-helpers'
import qrlAddressValdidator from '@theqrl/validate-qrl-address'
import { JsonRoutes } from 'meteor/simple:json-routes'
import { check } from 'meteor/check'
import { BrowserPolicy } from 'meteor/qrl:browser-policy'
import { blockData, quantausd } from '/imports/api/index.js'
import '/imports/startup/server/cron.js' /* eslint-disable-line */
import {
  EXPLORER_VERSION,
  SHOR_PER_QUANTA,
  anyAddressToRaw,
  bufferToHex,
} from '../both/index.js'

const PROTO_PATH =
  Assets.absoluteFilePath('qrlbase.proto').split('qrlbase.proto')[0]
console.log(`Using local folder ${PROTO_PATH} for Proto files`)

// Apply BrowserPolicy
// cloudflare's protection needs inline scripts
// BrowserPolicy.content.disallowInlineScripts()

BrowserPolicy.content.allowStyleOrigin('cdnjs.cloudflare.com')
BrowserPolicy.content.allowStyleOrigin('fonts.googleapis.com')
BrowserPolicy.content.allowStyleOrigin('cdn.jsdelivr.net')
BrowserPolicy.content.allowFontOrigin('fonts.gstatic.com')
BrowserPolicy.content.allowFontOrigin('cdnjs.cloudflare.com')
BrowserPolicy.content.allowFontOrigin('cdn.jsdelivr.net')
BrowserPolicy.content.allowFontOrigin('fonts.cdnfonts.com')
BrowserPolicy.content.allowStyleOrigin('fonts.cdnfonts.com')
BrowserPolicy.content.allowScriptOrigin('cdn.jsdelivr.net')
BrowserPolicy.content.allowScriptOrigin('cdnjs.cloudflare.com')
BrowserPolicy.content.allowFontDataUrl('cdnjs.cloudflare.com')
// Allow WebSocket connections to self
BrowserPolicy.content.allowConnectOrigin("'self'") // Allow same-origin WebSocket (Meteor DDP)
BrowserPolicy.content.allowConnectOrigin('wss://*.theqrl.org:*')
BrowserPolicy.content.allowConnectOrigin('ws://*.theqrl.org:*')
// The addresses of the API nodes and their state
// defaults to Testnet if run without config file
// state true is connected, false is disconnected
let API_NODES = [
  {
    id: 'testnet-1',
    address: 'testnet-1.automated.theqrl.org:19009',
    state: false,
    height: 0,
  },
  {
    id: 'testnet-2',
    address: 'testnet-2.automated.theqrl.org:19009',
    state: false,
    height: 0,
  },
  {
    id: 'testnet-3',
    address: 'testnet-3.automated.theqrl.org:19009',
    state: false,
    height: 0,
  },
  {
    id: 'testnet-4',
    address: 'testnet-4.automated.theqrl.org:19009',
    state: false,
    height: 0,
  },
]

// Grab config and set API nodes if set
try {
  if (Meteor.settings.api.primaryNode.length > 0) {
    // Reset API_NODES
    API_NODES = []
    // Set primary node
    API_NODES.push({
      address: Meteor.settings.api.primaryNode,
      state: false,
      height: 0,
    })
  }
  if (Meteor.settings.api.secondaryNode.length > 0) {
    // Set secondary node
    API_NODES.push({
      address: Meteor.settings.api.secondaryNode,
      state: false,
      height: 0,
    })
  }
  if (Meteor.settings.api.tertiaryNode.length > 0) {
    // Set tertiary node
    API_NODES.push({
      address: Meteor.settings.api.tertiaryNode,
      state: false,
      height: 0,
    })
  }
} catch (e) {
  // no configuration file used
}

// Store qrl api connections
const qrlClient = []

// Load the qrl.proto gRPC client into qrlClient from a remote node.
const loadGrpcClient = (endpoint, callback) => {
  // Load qrlbase.proto and fetch current qrl.proto from node
  const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [PROTO_PATH],
  }
  protoloader
    .load(`${PROTO_PATH}qrlbase.proto`)
    .then((packageDefinitionBase) => {
      const baseGrpcObject = grpc.loadPackageDefinition(packageDefinitionBase)
      const client = new baseGrpcObject.qrl.Base(
        endpoint,
        grpc.credentials.createInsecure(),
      )
      client.getNodeInfo({}, (err, res) => {
        if (err) {
          console.log(`Error fetching qrl.proto from ${endpoint}`)
          callback(err, null)
        } else {
          // Write a new temp file for this grpc connection
          const qrlProtoFilePath = tmp.fileSync({
            mode: '0644',
            prefix: 'qrl-',
            postfix: '.proto',
          }).name
          fs.writeFile(qrlProtoFilePath, res.grpcProto, (fsErr) => {
            if (fsErr) {
              console.log(fsErr)
              throw fsErr
            }
            protoloader
              .load(qrlProtoFilePath, options)
              .then((packageDefinition) => {
                const grpcObject = grpc.loadPackageDefinition(packageDefinition)
                // Create the gRPC Connection
                qrlClient[endpoint] = new grpcObject.qrl.PublicAPI(
                  endpoint,
                  grpc.credentials.createInsecure(),
                )
                console.log(
                  `qrlClient loaded for ${endpoint} from ${qrlProtoFilePath}`,
                )
                callback(null, true)
              })
          })
        }
      })
    })
}

const errorCallback = (error, message, alert) => {
  const d = new Date()
  const getTime = d.toUTCString()
  console.log(`${alert} [Timestamp: ${getTime}] ${error}`)
  const meteorError = new Meteor.Error(
    500,
    `[${getTime}] ${message} (${error})`,
  )
  return meteorError
}

// Establish a connection with a remote node.
// If there is no active server side connection for the requested node,
// this function will call loadGrpcClient to establish one.
const connectToNode = (endpoint, callback) => {
  // First check if there is an existing object to store the gRPC connection
  if (qrlClient.hasOwnProperty(endpoint) === true) {
    // eslint-disable-line
    console.log(
      'Existing connection found for ',
      endpoint,
      ' - attempting getNodeState',
    )
    // There is already a gRPC object for this server stored.
    // Attempt to connect to it.
    try {
      qrlClient[endpoint].getNodeState({}, (err, response) => {
        if (err) {
          console.log('Error fetching node state for ', endpoint)
          // If it errors, we're going to remove the object and attempt to connect again.
          delete qrlClient[endpoint]
          console.log('Attempting re-connection to ', endpoint)
          loadGrpcClient(endpoint, (loadErr, loadResponse) => {
            if (loadErr) {
              console.log(`Failed to re-connect to node ${endpoint}`)
              const myError = errorCallback(
                err,
                'Cannot connect to remote node',
                '**ERROR/connection** ',
              )
              callback(myError, null)
            } else {
              console.log(`Connected to ${endpoint}`)
              callback(null, loadResponse)
            }
          })
        } else {
          console.log(`Node state for ${endpoint} ok`)
          callback(null, response)
        }
      })
    } catch (err) {
      console.log('node state error exception')
      const myError = errorCallback(
        err,
        'Cannot access API/getNodeState',
        '**ERROR/getNodeState**',
      )
      callback(myError, null)
    }
  } else {
    console.log(`Establishing new connection to ${endpoint}`)
    // We've not connected to this node before, let's establish a connection to it.
    loadGrpcClient(endpoint, (err) => {
      if (err) {
        console.log(`Failed to connect to node ${endpoint}`)
        const myError = errorCallback(
          err,
          'Cannot connect to remote node',
          '**ERROR/connection** ',
        )
        callback(myError, null)
      } else {
        console.log(`Connected to ${endpoint}`)
        qrlClient[endpoint].getNodeState({}, (errState, response) => {
          if (errState) {
            console.log(`Failed to query node state ${endpoint}`)
            const myError = errorCallback(
              err,
              'Cannot connect to remote node',
              '**ERROR/connection** ',
            )
            callback(myError, null)
          } else {
            callback(null, response)
          }
        })
      }
    })
  }
}

// Connect to all nodes
const connectNodes = () => {
  API_NODES.forEach((node, index) => {
    const endpoint = node.address
    console.log(`Attempting to create gRPC connection to node: ${endpoint} ...`)
    connectToNode(endpoint, (err, res) => {
      if (err) {
        console.log(`Failed to connect to node ${endpoint}`)
        API_NODES[index].state = false
        API_NODES[index].height = 0
      } else {
        console.log(`Connected to ${endpoint}`)
        API_NODES[index].state = true
        API_NODES[index].height = parseInt(res.info.block_height, 10)
      }
    })
  })
}

const updateAutoIncrement = () => {
  // update autoincrement
  blockData.update({ _id: 'autoincrement' }, { $inc: { value: 1 } })
  // check cache not full
  if (blockData.findOne({ _id: 'autoincrement' }).value > 2500) {
    // empty cache and start again
    blockData.remove({})
    blockData.insert({ _id: 'autoincrement', value: 1 })
  }
}

// Server Startup
if (Meteor.isServer) {
  Meteor.startup(() => {
    console.log(`QRL Explorer Starting - Version: ${EXPLORER_VERSION}`)
    // Attempt to create connections with all nodes
    connectNodes()
    // remove cached data whilst cache featureset being iterated
    // (may want this to persist on restart in time)
    blockData.remove({})
    try {
      blockData.insert({ _id: 'autoincrement', value: 0 })
    } catch (err) {
      console.log('Autoincrement active on blockData')
    }
  })
}

// Maintain node connection status
Meteor.setInterval(() => {
  console.log('Refreshing node connection status')

  // Maintain state of connections to all nodes
  connectNodes()
}, 20000)

// Wrapper to provide highly available API results in the event
// the primary or secondary nodes go offline
const qrlApi = (api, request, callback) => {
  const activeNodes = []

  // Determine current active nodes
  API_NODES.forEach((node) => {
    if (node.state === true) {
      activeNodes.push(node)
    }
  })

  // Determine node with highest block height and set as bestNode
  const bestNode = {}
  bestNode.address = ''
  bestNode.height = 0
  activeNodes.forEach((node) => {
    if (node.height > bestNode.height) {
      bestNode.address = node.address
      bestNode.height = node.height
    }
  })

  // If all three nodes have gone offline, fail
  if (activeNodes.length === 0) {
    const myError = errorCallback(
      'The block explorer server cannot connect to any API node',
      'Cannot connect to API',
      '**ERROR/noActiveNodes/b**',
    )
    callback(myError, null)
  } else {
    // Make the API call
    qrlClient[bestNode.address][api](request, (error, response) => {
      callback(error, response)
    })
  }
}

function addTokenDetail(transaction) {
  const tokenDetail = {}
  const req = {
    query: Buffer.from(transaction.tx.transfer_token.token_txhash, 'hex'),
  }
  const response = Meteor.wrapAsync(getObject)(req) // eslint-disable-line no-use-before-define
  const formattedData = makeTxHumanReadable(response) // eslint-disable-line no-use-before-define
  tokenDetail.name = formattedData.transaction.tx.token.name
  tokenDetail.symbol = formattedData.transaction.tx.token.symbol
  tokenDetail.decimals = formattedData.transaction.tx.token.decimals
  tokenDetail.owner = `Q${Buffer.from(
    formattedData.transaction.tx.token.owner,
  ).toString('hex')}`
  return tokenDetail
}

const formatTokenAmount = (quantity, decimals) => {
  const num = new BigNumber(parseInt(quantity, 10))
  return num.dividedBy(10 ** parseInt(decimals, 10))
}

const sumTokenTotal = (arr, decimals) => {
  let total = new BigNumber(0)
  _.each(arr, (item) => {
    total = total.plus(parseInt(item, 10))
  })
  return total.dividedBy(10 ** parseInt(decimals, 10)).toNumber()
}

const helpersaddressTransactions = (response) => {
  const output = []
  // console.log(response)
  _.each(response.transactions_detail, (tx) => {
    const txEdited = tx
    if (tx.tx.transfer) {
      const hexlified = []
      _.each(tx.tx.transfer.addrs_to, (txOutput) => {
        // console.log('formatting: ', txOutput)
        hexlified.push(`Q${Buffer.from(txOutput).toString('hex')}`)
      })
      txEdited.tx.transfer.addrs_to = hexlified
    }
    if (tx.tx.coinbase) {
      if (tx.tx.coinbase.addr_to) {
        txEdited.tx.coinbase.addr_to = `Q${Buffer.from(
          txEdited.tx.coinbase.addr_to,
        ).toString('hex')}`
      }
    }
    if (tx.tx.transactionType === 'token') {
      // first check if NFT
      const symbol = Buffer.from(txEdited.tx.token.symbol).toString('hex')
      if (symbol.slice(0, 8) === '00ff00ff') {
        const nftBytes = Buffer.concat([
          Buffer.from(txEdited.tx.token.symbol),
          Buffer.from(txEdited.tx.token.name),
        ])
        const idBytes = Buffer.from(nftBytes.slice(4, 8))
        const cryptoHashBytes = Buffer.from(nftBytes.slice(8, 40))
        txEdited.tx.token.nft = {
          type: 'CREATE NFT',
          id: Buffer.from(idBytes).toString('hex'),
          hash: Buffer.from(cryptoHashBytes).toString('hex'),
        }
      }
      if (tx.tx.token.symbol) {
        txEdited.tx.token.symbol = Buffer.from(
          txEdited.tx.token.symbol,
        ).toString()
      }
      if (tx.tx.token.name) {
        txEdited.tx.token.name = Buffer.from(txEdited.tx.token.name).toString()
      }
    }
    if (tx.tx.transactionType === 'transfer_token') {
      if (tx.tx.transfer_token.token_txhash) {
        txEdited.tx.transfer_token.token_txhash = Buffer.from(
          txEdited.tx.transfer_token.token_txhash,
        ).toString('hex')
      }
      txEdited.tx.transfer_token = addTokenDetail(tx)
      // now check if NFT
      const symbol = Buffer.from(txEdited.tx.transfer_token.symbol).toString(
        'hex',
      )
      if (symbol.slice(0, 8) === '00ff00ff') {
        const nftBytes = Buffer.concat([
          Buffer.from(txEdited.tx.transfer_token.symbol),
          Buffer.from(txEdited.tx.transfer_token.name),
        ])
        const idBytes = Buffer.from(nftBytes.slice(4, 8))
        const cryptoHashBytes = Buffer.from(nftBytes.slice(8, 40))
        txEdited.tx.transfer_token.nft = {
          type: 'TRANSFER NFT',
          id: Buffer.from(idBytes).toString('hex'),
          hash: Buffer.from(cryptoHashBytes).toString('hex'),
        }
      }
      const hexlified = []
      const outputs = []
      _.each(tx.tx.transfer_token.addrs_to, (txOutput, index) => {
        hexlified.push(`Q${Buffer.from(txOutput).toString('hex')}`)
        outputs.push({
          address_hex: `Q${Buffer.from(txOutput).toString('hex')}`,
          amount: `${formatTokenAmount(
            tx.tx.transfer_token.amounts[index],
            txEdited.tx.transfer_token.decimals
          )} ${txEdited.tx.transfer_token.symbol}`,
        })
      })
      txEdited.tx.outputs = outputs
      txEdited.tx.totalTransferred = `${sumTokenTotal(
        tx.tx.transfer_token.amounts,
        txEdited.tx.transfer_token.decimals
      )} ${txEdited.tx.transfer_token.symbol}`
      txEdited.tx.transfer_token.addrs_to = hexlified
      if (tx.tx.transfer_token.symbol) {
        txEdited.tx.transfer_token.symbol = Buffer.from(
          txEdited.tx.transfer_token.symbol
        ).toString()
      }
      if (tx.tx.transfer_token.name) {
        txEdited.tx.transfer_token.name = Buffer.from(
          txEdited.tx.transfer_token.name
        ).toString()
      }
    }
    if (tx.tx.transaction_hash) {
      txEdited.tx.transaction_hash = Buffer.from(
        txEdited.tx.transaction_hash,
      ).toString('hex')
    }
    if (tx.tx.master_addr) {
      txEdited.tx.master_addr = `Q${Buffer.from(txEdited.tx.master_addr).toString(
        'hex',
      )}`
    }
    if (tx.tx.public_key) {
      txEdited.tx.public_key = Buffer.from(txEdited.tx.public_key).toString(
        'hex',
      )
    }
    if (tx.tx.signature) {
      txEdited.tx.signature = Buffer.from(txEdited.tx.signature).toString('hex')
    }
    if (tx.block_header_hash) {
      txEdited.block_header_hash = Buffer.from(
        txEdited.block_header_hash,
      ).toString('hex')
    }
    txEdited.addr_from = `Q${Buffer.from(txEdited.addr_from).toString('hex')}`
    console.dir(txEdited, { depth: null })
    output.push(txEdited)
  })
  response.transactions_detail = output
  return response
}

const getOTS = (request, callback) => {
  try {
    qrlApi('GetOTS', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetOTS',
          '**ERROR/getOTS** ',
        )
        callback(myError, null)
      } else {
        // console.log(response)
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetOTS',
      '**ERROR/GetOTS**',
    )
    callback(myError, null)
  }
}

const getFullAddressState = (request, callback) => {
  try {
    qrlApi('GetAddressState', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetOptimizedAddressState',
          '**ERROR/getAddressState** ',
        )
        callback(myError, null)
      } else {
        if (response.state.address) {
          response.state.address = `Q${Buffer.from(
            response.state.address,
          ).toString('hex')}`
        }

        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetAddressState',
      '**ERROR/GetAddressState**',
    )
    callback(myError, null)
  }
}

const getAddressState = (request, callback) => {
  try {
    qrlApi('GetOptimizedAddressState', request, (error, response) => {
      if (error || response.state === null) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetOptimizedAddressState',
          '**ERROR/getAddressState** '
        )
        callback(myError, null)
      } else {
        if (response.state.address) {
          response.state.address = `Q${Buffer.from(
            response.state.address
          ).toString('hex')}`
        }

        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetAddressState',
      '**ERROR/GetAddressState**',
    )
    callback(myError, null)
  }
}

const getMultiSigAddressState = (request, callback) => {
  try {
    qrlApi('GetMultiSigAddressState', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetMultiSigAddressState',
          '**ERROR/getMultiSigAddressState** ',
        )
        callback(myError, null)
      } else {
        if (response.state === null) {
          const myError = errorCallback(
            error,
            'No state returned for this address',
            '**ERROR/getMultiSigAddressState** '
          )
          callback(myError, null)
          return
        }
        if (response.state.address) {
          response.state.address = `Q${Buffer.from(
            response.state.address,
          ).toString('hex')}`
        }
        if (response.state.creation_tx_hash) {
          response.state.creation_tx_hash = Buffer.from(
            response.state.creation_tx_hash,
          ).toString('hex')
        }
        if (response.state.signatories) {
          const formatted = []
          _.each(response.state.signatories, (i) => {
            formatted.push(`Q${Buffer.from(i).toString('hex')}`)
          })
          response.state.signatories = formatted
        }
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetMultiSigAddressState',
      '**ERROR/GetMultiSigAddressState**',
    )
    callback(myError, null)
  }
}

export const getLatestData = (request, callback) => {
  try {
    qrlApi('GetLatestData', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetLatestData',
          '**ERROR/GetLatestData** ',
        )
        callback(myError, null)
      } else {
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetLatestData',
      '**ERROR/GetLatestData**',
    )
    callback(myError, null)
  }
}

export const getStats = (request, callback) => {
  try {
    qrlApi('GetStats', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetStats/a',
          '**ERROR/GetStats/a** ',
        )
        callback(myError, null)
      } else {
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetStats/b',
      '**ERROR/GetStats/b**',
    )
    callback(myError, null)
  }
}

export const getPeersStat = (request, callback) => {
  try {
    qrlApi('GetPeersStat', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetPeersStat/a',
          '**ERROR/GetPeersStat/a** ',
        )
        callback(myError, null)
      } else {
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetPeersStat/b',
      '**ERROR/GetPeersStat/b**',
    )
    callback(myError, null)
  }
}

export const getObject = (request, callback) => {
  try {
    qrlApi('GetObject', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetObject',
          '**ERROR/GetObject**',
        )
        callback(myError, null)
      } else {
        // console.log(response)
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetObject',
      '**ERROR/GetObject**',
    )
    callback(myError, null)
  }
}

export const getTransactionsByAddress = (request, callback) => {
  try {
    qrlApi('GetTransactionsByAddress', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetTransactionsByAddress',
          '**ERROR/GetTransactionsByAddress**',
        )
        callback(myError, null)
      } else {
        // console.log(response)
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetTransactionsByAddress',
      '**ERROR/GetTransactionsByAddress**',
    )
    callback(myError, null)
  }
}

export const getSlavesByAddress = (request, callback) => {
  try {
    qrlApi('GetSlavesByAddress', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetSlavesByAddress',
          '**ERROR/GetSlavesByAddress**',
        )
        callback(myError, null)
      } else {
        // console.log(response)
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetSlavesByAddress',
      '**ERROR/GetSlavesByAddress**',
    )
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

export const makeTxHumanReadable = (item) => {
  if (item.found !== false) {
    let output
    if (item.transaction.tx.transactionType === 'transfer_token') {
      try {
        // Request Token Decimals / Symbol
        const symbolRequest = {
          query: item.transaction.tx.transfer_token.token_txhash,
        }
        const thisSymbolResponse = Meteor.wrapAsync(getObject)(symbolRequest)
        output = helpers.parseTokenAndTransferTokenTx(thisSymbolResponse, item)
      } catch (e) {
        console.log('ERROR in makeTxHumanReadable', e)
      }
    } else {
      output = helpers.txhash(item)
    }
    return output
  }
  return item
}

export const makeTxListHumanReadable = (txList, confirmed) => {
  const outputList = []

  txList.forEach((item) => {
    // Add a transaction object to the returned transaction so we can use txhash helper
    const output = makeTxHumanReadable({ transaction: item })
    // Now put it back
    if (confirmed) {
      output.transaction.tx.confirmed = 'true'
    } else {
      output.transaction.tx.confirmed = 'false'
    }
    outputList.push(output.transaction)
  })

  return outputList
}

Meteor.methods({
  QRLvalue() {
    console.log('QRLvalue method called')
    this.unblock()
    const priceData = quantausd.findOne({})
    console.log(priceData)
    return priceData.price
  },

  status() {
    console.log('status method called')
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const response = Meteor.wrapAsync(getStats)({})
    return response
  },

  lastblocks() {
    console.log('lastblocks method called')
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const response = Meteor.wrapAsync(getLatestData)({
      filter: 'BLOCKHEADERS',
      offset: 0,
      quantity: 5,
    })
    return response
  },

  lastunconfirmedtx() {
    console.log('lastunconfirmedtx method called')
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const response = Meteor.wrapAsync(getLatestData)({
      filter: 'TRANSACTIONS_UNCONFIRMED',
      offset: 0,
      quantity: 5,
    })
    const unconfirmedReadable = makeTxListHumanReadable(
      response.transactions_unconfirmed,
      false,
    )
    response.transactions_unconfirmed = unconfirmedReadable
    return response
  },

  txhash(txId) {
    check(txId, String)
    console.log(`txhash method called for: ${txId}`)
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    if (!(Match.test(txId, String) && txId.length === 64)) {
      const errorCode = 400
      const errorMessage = 'Badly formed transaction ID'
      throw new Meteor.Error(errorCode, errorMessage)
    } else {
      // first check this is not cached
      const queryResults = blockData.findOne({ txId })
      if (queryResults !== undefined) {
        // cached transaction located
        // check if it's an unconfirmed Tx
        if (queryResults.formattedData.transaction.header !== null) {
          // not unconfirmed, return cached data
          console.log(`** INFO ** Returning cached data for txhash ${txId}`)
          return queryResults.formattedData
        }
      }
      // not cached or was unconfirmed so...
      // asynchronous call to API
      const req = { query: Buffer.from(txId, 'hex') }
      const response = Meteor.wrapAsync(getObject)(req)
      const formattedData = makeTxHumanReadable(response)
      try {
        if (formattedData.transaction.header !== null) {
          // not unconfirmed so insert into cache
          updateAutoIncrement()
          blockData.insert({ txId, formattedData })
        }
      } catch (e) {
        console.log('Null Tx ignored')
      }
      // return to client
      return formattedData
    }
  },

  block(blockId) {
    check(blockId, Number)
    console.log(`block Method called for: ${blockId}`)
    if (!Match.test(blockId, Number) || Number.isNaN(blockId)) {
      const errorCode = 400
      const errorMessage = 'Invalid block number'
      console.log('Throwing invalid block number error')
      throw new Meteor.Error(errorCode, errorMessage)
    } else {
      // avoid blocking other method calls from same client - *may need to remove for production*
      this.unblock()
      // first check this is not cached
      const queryResults = blockData.findOne({ blockId })
      if (queryResults !== undefined) {
        // cached transaction located
        console.log(`** INFO ** Returning cached data for block ${blockId}`)
        return queryResults.formattedData
      }

      // asynchronous call to API
      const req = {
        query: Buffer.from(blockId.toString()),
      }
      let response = Meteor.wrapAsync(getObject)(req)

      // Refactor for block_extended and extended_transactions
      response.block = response.block_extended
      response.block.transactions = response.block_extended.extended_transactions
      
      // Process all address fields in the entire response
      response = bufferToHex(response)

      if (response.block.header) {
        // transactions
        const transactions = []
        response.block.transactions.forEach((value) => {
          const adjusted = value.tx
          // All Buffer fields are now processed by bufferToHex above
          // No need for manual conversion
          if (adjusted.transactionType === 'coinbase') {
            // adjusted.coinbase.addr_to = adjusted.coinbase.addr_to <--- FIXME: why was this here?
            // FIXME: need to refactor to explorer.[GUI] format (below allow amount to be displayed)
            adjusted.transfer = adjusted.coinbase
          }
          if (adjusted.transactionType === 'token') {
            // first check if NFT
            let nft = {}
            const symbol = Buffer.from(adjusted.token.symbol).toString('hex')
            if (symbol.slice(0, 8) === '00ff00ff') {
              const nftBytes = Buffer.concat([
                Buffer.from(adjusted.token.symbol),
                Buffer.from(adjusted.token.name),
              ])
              const idBytes = Buffer.from(nftBytes.slice(4, 8))
              const cryptoHashBytes = Buffer.from(nftBytes.slice(8, 40))
              nft = {
                type: 'CREATE NFT',
                id: Buffer.from(idBytes).toString('hex'),
                hash: Buffer.from(cryptoHashBytes).toString('hex'),
              }
              adjusted.nft = nft
            }
          }
          if (adjusted.transactionType === 'transfer') {
            // Calculate total transferred, and generate a clean structure to display outputs from
            let thisTotalTransferred = 0
            let totalOutputs = 0
            _.each(adjusted.transfer.addrs_to, (thisAddress, index) => {
              totalOutputs += 1
              thisTotalTransferred += parseInt(
                adjusted.transfer.amounts[index],
                10,
              )
              // adjusted.transfer.addrs_to[index] = adjusted.transfer.addrs_to[index] <-- FIXME: why was this here?
            })
            adjusted.transfer.totalTransferred =
              thisTotalTransferred / SHOR_PER_QUANTA
            adjusted.transfer.totalOutputs = totalOutputs
          }
          if (adjusted.transactionType === 'transfer_token') {
            // Request Token Decimals / Symbol
            const symbolRequest = {
              query: Buffer.from(adjusted.transfer_token.token_txhash, 'hex'),
            }
            const thisSymbolResponse =
              Meteor.wrapAsync(getObject)(symbolRequest)
            // eslint-disable-next-line
            const thisSymbol = Buffer.from(
              thisSymbolResponse.transaction.tx.token.symbol,
            ).toString()
            const thisDecimals = thisSymbolResponse.transaction.tx.token.decimals
            // Calculate total transferred, and generate a clean structure to display outputs from
            let thisTotalTransferred = 0
            let totalOutputs = 0
            _.each(adjusted.transfer_token.addrs_to, (thisAddress, index) => {
              totalOutputs += 1
              thisTotalTransferred += parseInt(
                adjusted.transfer_token.amounts[index],
                10,
              )
              // adjusted.transfer_token.addrs_to[index] = adjusted.transfer_token.addrs_to[index] <-- FIXME: why was this here?
            })
            // eslint-disable-next-line
            adjusted.transfer_token.totalTransferred =
              thisTotalTransferred / 10 ** thisDecimals
            adjusted.transfer_token.totalOutputs = totalOutputs
            adjusted.transfer_token.tokenSymbol = thisSymbol
            let nft = {}
            console.log(thisSymbolResponse)
            const symbol = Buffer.from(
              thisSymbolResponse.transaction.tx.token.symbol,
            ).toString('hex')
            if (symbol.slice(0, 8) === '00ff00ff') {
              const nftBytes = Buffer.concat([
                Buffer.from(thisSymbolResponse.transaction.tx.token.symbol),
                Buffer.from(thisSymbolResponse.transaction.tx.token.name),
              ])
              const idBytes = Buffer.from(nftBytes.slice(4, 8))
              const cryptoHashBytes = Buffer.from(nftBytes.slice(8, 40))
              nft = {
                type: 'TRANSFER NFT',
                id: Buffer.from(idBytes).toString('hex'),
                hash: Buffer.from(cryptoHashBytes).toString('hex'),
              }
              adjusted.nft = nft
            }
          }
          transactions.push(adjusted)
        })

        response.block.transactions = transactions
      }
      // insert into cache
      updateAutoIncrement()
      blockData.insert({ blockId, formattedData: response })
      return response
    }
  },

  addressTransactions(request) {
    check(request, Object)
    console.log(
      `addressTransactions method called for ${request.tx.length} transactions`,
    )
    const targets = request.tx
    const result = []
    targets.forEach((arr) => {
      const req = { query: Buffer.from(arr.txhash, 'hex') }
      try {
        const thisTxnHashResponse = Meteor.wrapAsync(getObject)(req)

        const output = helpers.txhash(thisTxnHashResponse)

        let thisTxn = {}

        if (output.transaction.tx.transactionType === 'transfer') {
          thisTxn = {
            type: output.transaction.tx.transactionType,
            txhash: arr.txhash,
            totalTransferred: output.transaction.explorer.totalTransferred,
            outputs: output.transaction.explorer.outputs,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            ots_key: parseInt(
              output.transaction.tx.signature.substring(0, 8),
              16,
            ),
            fee: output.transaction.tx.fee,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (output.transaction.tx.transactionType === 'token') {
          // first check if NFT
          let nft = {}
          const symbol = Buffer.from(
            output.transaction.tx.token.symbol,
          ).toString('hex')
          if (symbol.slice(0, 8) === '00ff00ff') {
            const nftBytes = Buffer.concat([
              Buffer.from(output.transaction.tx.token.symbol),
              Buffer.from(output.transaction.tx.token.name),
            ])
            const idBytes = Buffer.from(nftBytes.slice(4, 8))
            const cryptoHashBytes = Buffer.from(nftBytes.slice(8, 40))
            nft = {
              type: 'CREATE NFT',
              id: Buffer.from(idBytes).toString('hex'),
              hash: Buffer.from(cryptoHashBytes).toString('hex'),
            }
            console.log('Found an NFT')
          }

          thisTxn = {
            type: output.transaction.tx.transactionType,
            txhash: arr.txhash,
            nft,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            symbol: output.transaction.tx.token.symbol,
            name: output.transaction.tx.token.name,
            decimals: output.transaction.tx.token.decimals,
            ots_key: parseInt(
              output.transaction.tx.signature.substring(0, 8),
              16,
            ),
            fee: output.transaction.tx.fee,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }

          result.push(thisTxn)
        } else if (
          thisTxnHashResponse.transaction.tx.transactionType
          === 'transfer_token'
        ) {
          // Request Token Symbol
          const symbolRequest = {
            query: Buffer.from(
              Buffer.from(
                thisTxnHashResponse.transaction.tx.transfer_token.token_txhash,
              ).toString('hex'),
              'hex',
            ),
          }
          const thisSymbolResponse = Meteor.wrapAsync(getObject)(symbolRequest)
          const helpersResponse = helpers.parseTokenAndTransferTokenTx(
            thisSymbolResponse,
            thisTxnHashResponse,
          )
          thisTxn = {
            type: helpersResponse.transaction.tx.transactionType,
            txhash: arr.txhash,
            symbol: helpersResponse.transaction.explorer.symbol,
            // eslint-disable-next-line
            totalTransferred:
              helpersResponse.transaction.explorer.totalTransferred,
            outputs: helpersResponse.transaction.explorer.outputs,
            from_hex: helpersResponse.transaction.explorer.from_hex,
            from_b32: helpersResponse.transaction.explorer.from_b32,
            ots_key: parseInt(
              helpersResponse.transaction.tx.signature.substring(0, 8),
              16,
            ),
            fee: helpersResponse.transaction.tx.fee / SHOR_PER_QUANTA,
            block: helpersResponse.transaction.header.block_number,
            timestamp: helpersResponse.transaction.header.timestamp_seconds,
          }

          result.push(thisTxn)
        } else if (output.transaction.tx.transactionType === 'coinbase') {
          thisTxn = {
            type: output.transaction.tx.transactionType,
            txhash: arr.txhash,
            amount: output.transaction.tx.coinbase.amount / SHOR_PER_QUANTA,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            to: output.transaction.tx.coinbase.addr_to,
            ots_key: '',
            fee: output.transaction.tx.fee / SHOR_PER_QUANTA,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (output.transaction.tx.transactionType === 'slave') {
          thisTxn = {
            type: output.transaction.tx.transactionType,
            txhash: arr.txhash,
            amount: 0,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            to: '',
            ots_key: parseInt(
              output.transaction.tx.signature.substring(0, 8),
              16,
            ),
            fee: output.transaction.tx.fe,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (output.transaction.tx.transactionType === 'latticePK') {
          thisTxn = {
            type: output.transaction.tx.transactionType,
            txhash: arr.txhash,
            amount: 0,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            to: '',
            ots_key: parseInt(
              output.transaction.tx.signature.substring(0, 8),
              16,
            ),
            fee: output.transaction.tx.fee,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (output.transaction.explorer.type === 'MESSAGE') {
          thisTxn = {
            type: output.transaction.explorer.type,
            txhash: arr.txhash,
            amount: 0,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            to: '',
            ots_key: parseInt(
              output.transaction.tx.signature.substring(0, 8),
              16,
            ),
            fee: output.transaction.tx.fee,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (output.transaction.explorer.type === 'KEYBASE') {
          thisTxn = {
            type: output.transaction.explorer.type,
            txhash: arr.txhash,
            amount: 0,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            to: '',
            ots_key: parseInt(
              output.transaction.tx.signature.substring(0, 8),
              16,
            ),
            fee: output.transaction.tx.fee,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (
          output.transaction.explorer.type === 'DOCUMENT_NOTARISATION'
        ) {
          thisTxn = {
            type: output.transaction.explorer.type,
            txhash: arr.txhash,
            amount: 0,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            to: '',
            ots_key: parseInt(
              output.transaction.tx.signature.substring(0, 8),
              16,
            ),
            fee: output.transaction.tx.fee,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        }
      } catch (err) {
        console.log(
          `Error fetching transaction hash in addressTransactions '${arr.txhash}' - ${err}`,
        )
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

  getAddressState(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getAddressState)(request)
    return response
  },

  getFullAddressState(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getFullAddressState)(request)
    return response
  },

  getMultiSigAddressState(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getMultiSigAddressState)(request)
    return response
  },

  getOTS(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getOTS)(request)
    return response
  },

  getTransactionsByAddress(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getTransactionsByAddress)(request)
    console.table(response)
    return helpersaddressTransactions(response)
  },

  getSlavesByAddress(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getSlavesByAddress)(request)
    console.log('response', response)
    const res = []
    _.forEach(response.slaves_detail, (item) => {
      const i = item
      i.slave_address = `Q${Buffer.from(item.slave_address).toString('hex')}`
      res.push(i)
    })
    return res
  },

  connectionStatus() {
    console.log('connectionStatus method called')
    this.unblock()
    const activeNodes = []
    API_NODES.forEach((node) => {
      if (node.state === true) {
        activeNodes.push(node.address)
      }
    })
    if (activeNodes.length === 0) {
      const res = { colour: 'red' }
      return res
    }
    // get first 7 characters of the first node
    const firstNode = activeNodes[0].substring(0, 7)
    const res = { colour: 'green', network: firstNode }
    return res
  },
})

JsonRoutes.add('get', '/api/a/:id', (req, res) => {
  const aId = req.params.id
  check(aId, String)
  const validate = qrlAddressValdidator.hexString(aId)
  let response = {}
  if (validate.result === true) {
    const request = {
      address: anyAddressToRaw(aId),
    }
    try {
      if (validate.sig.type !== 'MULTISIG') {
        response = Meteor.wrapAsync(getAddressState)(request)
        response.isMultisig = false
      } else {
        response = Meteor.wrapAsync(getMultiSigAddressState)(request)
        response.isMultisig = true
      }
    } catch (e) {
      response = e
    }
  } else {
    response = { found: false, message: 'Invalid QRL address', code: 3000 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

function apiTxList(req, res, num) {
  const aId = req.params.id
  check(aId, String)
  const validate = qrlAddressValdidator.hexString(aId)
  let response = {}
  let totalPages = 0

  if (validate.result === true) {
    try {
      const request = {
        address: anyAddressToRaw(aId),
        item_per_page: 10,
        page_number: num,
      }

      // Get address state to calculate total pages
      const addressStateRequest = {
        address: anyAddressToRaw(aId),
      }

      let addressState
      if (validate.sig.type !== 'MULTISIG') {
        addressState = Meteor.wrapAsync(getAddressState)(addressStateRequest)
      } else {
        addressState = Meteor.wrapAsync(getMultiSigAddressState)(
          addressStateRequest,
        )
      }

      // Calculate total pages based on transaction count
      let totalTransactions = 0
      if (addressState.state && addressState.state.transaction_hashes) {
        totalTransactions = addressState.state.transaction_hashes.length
      } else if (
        addressState.state
        && addressState.state.transaction_hash_count
      ) {
        totalTransactions = parseInt(
          addressState.state.transaction_hash_count,
          10,
        )
      }
      totalPages = Math.ceil(totalTransactions / 10)

      const rawResponse = Meteor.wrapAsync(getTransactionsByAddress)(request)
      const processedResponse = helpersaddressTransactions(rawResponse)
      response = bufferToHex(processedResponse)
    } catch (e) {
      response = e
      JsonRoutes.sendResult(res, {
        data: { found: false, message: response.message, code: 3001 },
      })
      return
    }
  } else {
    JsonRoutes.sendResult(res, {
      data: { found: false, message: 'Invalid QRL address', code: 3000 },
    })
    return
  }
  JsonRoutes.sendResult(res, {
    data: {
      found: true,
      address: aId,
      page: num,
      totalPages,
      transactions: response,
    },
  })
}

JsonRoutes.add('get', '/api/a/tx/:id/:num', (req, res) => {
  const num = parseInt(req.params.num, 10) || 0
  if (num === 0) {
    // return that page number, if passed, must start with a 1
    JsonRoutes.sendResult(res, {
      data: { found: false, message: 'Invalid page number', code: 3003 },
    })
    return
  }
  apiTxList(req, res, num)
})

JsonRoutes.add('get', '/api/a/tx/:id', (req, res) => {
  apiTxList(req, res, 1)
})

JsonRoutes.add('get', '/api/tx/:id', (req, res) => {
  const txId = req.params.id
  check(txId, String)
  let response = {}
  if (txId.length === 64) {
    // first check this is not cached
    const queryResults = blockData.findOne({ txId })
    if (queryResults !== undefined) {
      // cached transaction located
      response = queryResults.formattedData
    } else {
      // cache empty, query grpc
      const request = { query: Buffer.from(txId, 'hex') }
      try {
        response = Meteor.wrapAsync(getObject)(request)
      } catch (e) {
        response = e
      }
    }
  } else {
    response = { found: false, message: 'Invalid Txhash', code: 3001 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/block/:id', (req, res) => {
  const txId = req.params.id
  check(txId, String)
  let response = {}
  if (parseInt(txId, 10).toString() === txId) {
    // first check this is not cached
    const queryResults = blockData.findOne({ txId })
    if (queryResults !== undefined) {
      // cached transaction located
      response = queryResults.formattedData
    } else {
      // cache empty, query grpc
      const request = { query: Buffer.from(txId) }
      try {
        response = Meteor.wrapAsync(getObject)(request)
      } catch (e) {
        response = e
      }
    }
  } else {
    response = { found: false, message: 'Invalid Block', code: 3002 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})
