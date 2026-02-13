/* eslint no-console: 0, max-len: 0 */
/* global _ */

// server-side startup
import grpc from '@grpc/grpc-js'
import protoloader from '@grpc/proto-loader'
import tmp from 'tmp'
import fs from 'fs'
import crypto from 'crypto'
import BigNumber from 'bignumber.js'
import helpers from '@theqrl/explorer-helpers'
import qrlAddressValdidator from '@theqrl/validate-qrl-address'
import { JsonRoutes } from 'meteor/simple:json-routes'
import { check, Match } from 'meteor/check'
import { WebApp } from 'meteor/webapp'
import { blockData, quantausd } from '/imports/api/index.js'
import '/imports/startup/server/cron.js' /* eslint-disable-line */
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter'
import {
  EXPLORER_VERSION,
  SHOR_PER_QUANTA,
  anyAddressToRaw,
  bufferToHex,
} from '../both/index.js'

const PROTO_PATH = Assets.absoluteFilePath('qrlbase.proto').split('qrlbase.proto')[0]
console.log(`Using local folder ${PROTO_PATH} for Proto files`)

// Determine gRPC credentials based on configuration.
// Set Meteor.settings.api.grpcSecurity to "tls" to enable TLS.
// Defaults to insecure for backward compatibility with existing QRL node deployments.
const getGrpcCredentials = () => {
  try {
    if (Meteor.settings.api.grpcSecurity === 'tls') {
      console.log('Using TLS for gRPC connections')
      return grpc.credentials.createSsl()
    }
  } catch (e) {
    // No settings or grpcSecurity not configured
  }
  console.log('WARNING: Using insecure gRPC credentials. Set api.grpcSecurity to "tls" in settings to enable TLS.')
  return grpc.credentials.createInsecure()
}

// Validate that a proto file content looks like a legitimate QRL protobuf definition.
// This prevents loading arbitrary code from a compromised node.
const validateProtoContent = (protoContent) => {
  if (typeof protoContent !== 'string' || protoContent.length === 0) {
    return false
  }
  // Must contain proto3 syntax declaration
  if (!protoContent.includes('syntax = "proto3"')) {
    return false
  }
  // Must define the qrl package
  if (!protoContent.includes('package qrl')) {
    return false
  }
  // Must define the PublicAPI service (the service the explorer uses)
  if (!protoContent.includes('service PublicAPI')) {
    return false
  }
  // Must not contain suspicious content (import of non-proto files, shell commands, etc.)
  if (/import\s+"[^"]*\.(js|sh|py|rb|php|exe|bat|cmd)/i.test(protoContent)) {
    return false
  }
  // Size sanity check: proto files shouldn't be excessively large (max 1MB)
  if (protoContent.length > 1024 * 1024) {
    return false
  }
  return true
}

// CSP nonce generation and HTML injection middleware
// Register at module load time to ensure proper ordering
WebApp.connectHandlers.use((req, res, next) => {
  // Generate a unique nonce for this request
  const nonce = crypto.randomBytes(16).toString('base64')

  // Store nonce in response locals for use in templates
  res.locals = res.locals || {}
  res.locals.cspNonce = nonce

  // Set the nonce in the CSP header
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    'style-src \'self\' \'unsafe-inline\'',
    "font-src 'self' data:",
    "connect-src 'self' https: wss: ws: wss://*.theqrl.org:* ws://*.theqrl.org:*",
    "img-src 'self' data: https:",
    "frame-src 'self'",
  ].join('; ')

  res.setHeader('Content-Security-Policy', cspHeader)

  next()
})

// HTML modification middleware to inject nonce into script tags
// Must be registered at module load time, after CSP middleware
WebApp.connectHandlers.use((req, res, next) => {
  // Skip if nonce not set (shouldn't happen, but safety check)
  if (!res.locals || !res.locals.cspNonce) {
    return next()
  }

  const originalWrite = res.write
  const originalEnd = res.end
  const originalSetHeader = res.setHeader
  const chunks = []
  let contentType = ''

  // Intercept setHeader to capture Content-Type
  res.setHeader = function (name, value) {
    if (name.toLowerCase() === 'content-type') {
      contentType = value
    }
    return originalSetHeader.call(this, name, value)
  }

  res.write = function (chunk) {
    chunks.push(Buffer.from(chunk))
  }

  res.end = function (chunk) {
    if (chunk) {
      chunks.push(Buffer.from(chunk))
    }

    // Only modify HTML responses, skip JSON/API responses
    const isHtml = contentType.includes('text/html')
                   || (!contentType && chunks.length > 0)

    if (!isHtml || chunks.length === 0) {
      // Not HTML or no content, pass through
      res.write = originalWrite
      res.end = originalEnd
      res.setHeader = originalSetHeader

      chunks.forEach((c) => {
        originalWrite.call(res, c)
      })
      return originalEnd.call(res)
    }

    const body = Buffer.concat(chunks).toString('utf8')
    const nonce = res.locals.cspNonce

    // Add nonce to all script tags that don't already have one
    const modifiedBody = body.replace(
      /<script(?![^>]*nonce=)/g,
      `<script nonce="${nonce}"`,
    )

    res.write = originalWrite
    res.end = originalEnd
    res.setHeader = originalSetHeader
    res.end(modifiedBody)
  }

  next()
})

// Rate limit DDP methods that call gRPC to prevent abuse
// 5 method calls per second per connection
DDPRateLimiter.addRule({
  type: 'method',
  name(name) {
    return [
      'QRLvalue', 'status', 'lastblocks', 'lastunconfirmedtx', 'txhash', 'block',
      'addressTransactions', 'getStats', 'getObject', 'getLatestData',
      'getAddressState', 'getFullAddressState', 'getMultiSigAddressState',
      'getOTS', 'getTransactionsByAddress', 'getSlavesByAddress', 'connectionStatus',
    ].includes(name)
  },
}, 5, 1000)

// Rate limit subscriptions: 20 per second per connection
// (home page loads 5+ subscriptions simultaneously, plus Meteor internals)
DDPRateLimiter.addRule({
  type: 'subscription',
}, 20, 1000)

// Simple in-memory rate limiter for REST API routes
const apiRateLimits = new Map()
const API_RATE_LIMIT = 30 // requests per window
const API_RATE_WINDOW = 60000 // 1 minute window
const TRUST_PROXY = (() => {
  try {
    if (Meteor.settings && Meteor.settings.api && Meteor.settings.api.trustProxy === true) {
      return true
    }
    if (Meteor.settings && Meteor.settings.TRUST_PROXY === true) {
      return true
    }
  } catch (e) {
    // settings not loaded
  }

  const trustProxyEnv = process.env.TRUST_PROXY || ''
  return trustProxyEnv === 'true' || trustProxyEnv === '1'
})()

function getClientIp(req) {
  if (TRUST_PROXY) {
    const forwardedFor = req && req.headers ? req.headers['x-forwarded-for'] : null
    if (typeof forwardedFor === 'string') {
      const firstForwardedIp = forwardedFor
        .split(',')
        .map((entry) => entry.trim())
        .find((entry) => entry.length > 0)
      if (firstForwardedIp) {
        return firstForwardedIp
      }
    }
  }

  if (req && req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress
  }
  if (req && req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress
  }
  return 'unknown'
}

function checkApiRateLimit(req) {
  const ip = getClientIp(req)
  const now = Date.now()
  const record = apiRateLimits.get(ip)
  if (!record || now - record.windowStart > API_RATE_WINDOW) {
    apiRateLimits.set(ip, { windowStart: now, count: 1 })
    return true
  }
  record.count++
  return record.count <= API_RATE_LIMIT
}

// Periodically clean up stale rate limit entries
Meteor.setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of apiRateLimits) {
    if (now - record.windowStart > API_RATE_WINDOW * 2) {
      apiRateLimits.delete(ip)
    }
  }
}, API_RATE_WINDOW * 2)

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
  const credentials = getGrpcCredentials()
  protoloader
    .load(`${PROTO_PATH}qrlbase.proto`)
    .then((packageDefinitionBase) => {
      const baseGrpcObject = grpc.loadPackageDefinition(packageDefinitionBase)
      const client = new baseGrpcObject.qrl.Base(
        endpoint,
        credentials,
      )
      client.getNodeInfo({}, (err, res) => {
        if (err) {
          console.log(`Error fetching qrl.proto from ${endpoint}:`, err.message || err)
          callback(err, null)
        } else {
          // Validate the proto content before loading it
          if (!validateProtoContent(res.grpcProto)) {
            console.log(`ERROR: Invalid or suspicious proto content received from ${endpoint}`)
            callback(new Error('Proto validation failed: content does not match expected QRL proto format'), null)
            return
          }

          // Write a new temp file for this grpc connection with restrictive permissions
          const qrlProtoFilePath = tmp.fileSync({
            mode: 0o600,
            prefix: 'qrl-',
            postfix: '.proto',
          }).name
          fs.writeFile(qrlProtoFilePath, res.grpcProto, (fsErr) => {
            if (fsErr) {
              console.log(fsErr)
              callback(fsErr, null)
              return
            }
            protoloader
              .load(qrlProtoFilePath, options)
              .then((packageDefinition) => {
                const grpcObject = grpc.loadPackageDefinition(packageDefinition)
                // Create the gRPC Connection
                qrlClient[endpoint] = new grpcObject.qrl.PublicAPI(
                  endpoint,
                  credentials,
                )
                console.log(
                  `qrlClient loaded for ${endpoint}`,
                )
                // Clean up temp file after loading
                try {
                  fs.unlink(qrlProtoFilePath, () => {})
                } catch (cleanupErr) {
                  // Non-fatal: temp file cleanup failed
                }
                callback(null, true)
              })
              .catch((loadErr) => {
                console.log(`Error loading proto definition from ${endpoint}:`, loadErr.message)
                callback(loadErr, null)
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
  if (Object.prototype.hasOwnProperty.call(qrlClient, endpoint) === true) {
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

// Connect to all nodes (callback-based for backwards compatibility)
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

// Connect to all nodes (Promise-based)
const connectNodesAsync = async () => {
  const connectionPromises = API_NODES.map((node, index) => new Promise((resolve) => {
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
      // Always resolve, even on error, so we don't block other connections
      resolve()
    })
  }))

  await Promise.all(connectionPromises)

  // Log connection summary
  const activeCount = API_NODES.filter((node) => node.state === true).length
  console.log(`Connected to ${activeCount} of ${API_NODES.length} nodes`)
}

const updateAutoIncrement = async () => {
  const incrementResult = await blockData.rawCollection().findOneAndUpdate(
    { _id: 'autoincrement' },
    { $inc: { value: 1 } },
    {
      upsert: true,
      returnDocument: 'after',
    },
  )
  const autoIncrementValue = incrementResult && incrementResult.value
    ? incrementResult.value
    : 0

  if (autoIncrementValue > 2500) {
    const resetResult = await blockData.rawCollection().findOneAndUpdate(
      { _id: 'autoincrement', value: { $gt: 2500 } },
      { $set: { value: 1 } },
      { returnDocument: 'after' },
    )

    if (resetResult) {
      // Remove only cached data entries, not the autoincrement counter itself.
      await blockData.removeAsync({ _id: { $ne: 'autoincrement' } })
    }
  }
}

// Server Startup
if (Meteor.isServer) {
  Meteor.startup(async () => {
    console.log(`QRL Explorer Starting - Version: ${EXPLORER_VERSION}`)

    // Attempt to create connections with all nodes - wait for completion
    console.log('Establishing GRPC connections...')
    await connectNodesAsync()
    console.log('GRPC connection establishment complete')

    // remove cached data whilst cache featureset being iterated
    // (may want this to persist on restart in time)
    await blockData.removeAsync({})
    try {
      await blockData.insertAsync({ _id: 'autoincrement', value: 0 })
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
    // Validate client and method exist
    if (!qrlClient[bestNode.address]) {
      const myError = errorCallback(
        `GRPC client not initialized for ${bestNode.address}`,
        'GRPC client not available',
        '**ERROR/clientNotReady**',
      )
      callback(myError, null)
      return
    }
    if (!qrlClient[bestNode.address][api]) {
      const myError = errorCallback(
        `GRPC method ${api} not available on ${bestNode.address}`,
        'GRPC method not available',
        '**ERROR/methodNotAvailable**',
      )
      callback(myError, null)
      return
    }
    // Make the API call
    try {
      qrlClient[bestNode.address][api](request, (error, response) => {
        if (error) {
          callback(error, null)
        } else if (!response) {
          const myError = errorCallback(
            'Empty response from GRPC call',
            'No response data',
            '**ERROR/emptyResponse**',
          )
          callback(myError, null)
        } else {
          callback(null, response)
        }
      })
    } catch (err) {
      const myError = errorCallback(
        err,
        `Error calling ${api}`,
        '**ERROR/apiCallFailed**',
      )
      callback(myError, null)
    }
  }
}

// Promise-based wrapper for qrlApi
const qrlApiAsync = (api, request) => new Promise((resolve, reject) => {
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

  // If all nodes have gone offline, fail
  if (activeNodes.length === 0) {
    const myError = errorCallback(
      'The block explorer server cannot connect to any API node',
      'Cannot connect to API',
      '**ERROR/noActiveNodes/b**',
    )
    reject(myError)
  } else {
    // Validate client exists
    if (!qrlClient[bestNode.address] || !qrlClient[bestNode.address][api]) {
      const myError = errorCallback(
        `GRPC client not ready for ${bestNode.address}`,
        'GRPC client not available',
        '**ERROR/clientNotReady**',
      )
      reject(myError)
      return
    }

    // Make the API call
    qrlClient[bestNode.address][api](request, (error, response) => {
      if (error) {
        reject(error)
      } else if (!response) {
        const myError = errorCallback(
          'Empty response from GRPC call',
          'No response data',
          '**ERROR/emptyResponse**',
        )
        reject(myError)
      } else {
        resolve(response)
      }
    })
  }
})

async function addTokenDetail(transaction) {
  const tokenDetail = {}
  const req = {
    query: Buffer.from(transaction.tx.transfer_token.token_txhash, 'hex'),
  }
  const response = await getObjectAsync(req)
  const formattedData = await makeTxHumanReadable(response)
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

const helpersaddressTransactions = async (response) => {
  const output = []
  // console.log(response)
  for (const tx of response.transactions_detail) {
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
      const tokenDetail = await addTokenDetail(tx)
      Object.assign(txEdited.tx.transfer_token, tokenDetail)
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
            txEdited.tx.transfer_token.decimals,
          )} ${txEdited.tx.transfer_token.symbol}`,
        })
      })
      txEdited.tx.outputs = outputs
      txEdited.tx.totalTransferred = `${sumTokenTotal(
        tx.tx.transfer_token.amounts,
        txEdited.tx.transfer_token.decimals,
      )} ${txEdited.tx.transfer_token.symbol}`
      txEdited.tx.transfer_token.addrs_to = hexlified
      if (tx.tx.transfer_token.symbol) {
        txEdited.tx.transfer_token.symbol = Buffer.from(
          txEdited.tx.transfer_token.symbol,
        ).toString()
      }
      if (tx.tx.transfer_token.name) {
        txEdited.tx.transfer_token.name = Buffer.from(
          txEdited.tx.transfer_token.name,
        ).toString()
      }
    }
    if (tx.tx.transaction_hash) {
      txEdited.tx.transaction_hash = Buffer.from(
        tx.tx.transaction_hash,
      ).toString('hex')
    }
    if (tx.tx.master_addr) {
      txEdited.tx.master_addr = `Q${Buffer.from(tx.tx.master_addr).toString(
        'hex',
      )}`
    }
    if (tx.tx.public_key) {
      txEdited.tx.public_key = Buffer.from(tx.tx.public_key).toString(
        'hex',
      )
    }
    if (tx.tx.signature) {
      txEdited.tx.signature = Buffer.from(tx.tx.signature).toString('hex')
    }
    if (tx.block_header_hash) {
      txEdited.block_header_hash = Buffer.from(
        tx.block_header_hash,
      ).toString('hex')
    }
    txEdited.addr_from = `Q${Buffer.from(tx.addr_from).toString('hex')}`
    output.push(txEdited)
  }
  response.transactions_detail = output
  return response
}

const getOTSAsync = (request) => new Promise((resolve, reject) => {
  try {
    qrlApi('GetOTS', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetOTS',
          '**ERROR/getOTS** ',
        )
        reject(myError)
      } else {
        resolve(response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetOTS',
      '**ERROR/GetOTS**',
    )
    reject(myError)
  }
})

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
            '**ERROR/getMultiSigAddressState** ',
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

const getAddressStateAsync = (request) => new Promise((resolve, reject) => {
  getAddressState(request, (error, response) => {
    if (error) {
      reject(error)
    } else {
      resolve(response)
    }
  })
})

const getFullAddressStateAsync = (request) => new Promise((resolve, reject) => {
  getFullAddressState(request, (error, response) => {
    if (error) {
      reject(error)
    } else {
      resolve(response)
    }
  })
})

const getMultiSigAddressStateAsync = (request) => new Promise((resolve, reject) => {
  getMultiSigAddressState(request, (error, response) => {
    if (error) {
      reject(error)
    } else {
      resolve(response)
    }
  })
})

const getTransactionsByAddressAsync = (request) => new Promise((resolve, reject) => {
  getTransactionsByAddress(request, (error, response) => {
    if (error) {
      reject(error)
    } else {
      resolve(response)
    }
  })
})

const getSlavesByAddressAsync = (request) => new Promise((resolve, reject) => {
  getSlavesByAddress(request, (error, response) => {
    if (error) {
      reject(error)
    } else {
      resolve(response)
    }
  })
})

export const getLatestData = (request, callback) => {
  try {
    qrlApi('GetLatestData', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetLatestData',
          '**ERROR/GetLatestData**',
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
    throw myError
  }
}

// Promise-based version of getLatestData
export const getLatestDataAsync = (request) => new Promise((resolve, reject) => {
  try {
    qrlApi('GetLatestData', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetLatestData',
          '**ERROR/GetLatestData**',
        )
        reject(myError)
      } else {
        resolve(response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetLatestData',
      '**ERROR/GetLatestData**',
    )
    reject(myError)
  }
})

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

export const getStatsAsync = async (request) => new Promise((resolve, reject) => {
  try {
    qrlApi('GetStats', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetStats',
          '**ERROR/GetStats**',
        )
        reject(myError)
      } else {
        resolve(response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetStats',
      '**ERROR/GetStats**',
    )
    reject(myError)
  }
})

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

export const getPeersStatAsync = async (request) => {
  try {
    const response = await qrlApiAsync('GetPeersStat', request)
    return response
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetPeersStat',
      '**ERROR/GetPeersStat**',
    )
    throw myError
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
      } else if (!response) {
        const myError = errorCallback(
          'Empty response from API',
          'No data returned from GetObject',
          '**ERROR/GetObject/EmptyResponse**',
        )
        callback(myError, null)
      } else {
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

// Promise-based version of getObject
export const getObjectAsync = (request) => new Promise((resolve, reject) => {
  try {
    qrlApi('GetObject', request, (error, response) => {
      if (error) {
        const myError = errorCallback(
          error,
          'Cannot access API/GetObject',
          '**ERROR/GetObject**',
        )
        reject(myError)
      } else if (!response) {
        const myError = errorCallback(
          'Empty response from API',
          'No data returned from GetObject',
          '**ERROR/GetObject/EmptyResponse**',
        )
        reject(myError)
      } else {
        resolve(response)
      }
    })
  } catch (error) {
    const myError = errorCallback(
      error,
      'Cannot access API/GetObject',
      '**ERROR/GetObject**',
    )
    reject(myError)
  }
})

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
  fetch(apiUrl)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        return response.json()
      }

      const textResponse = await response.text()
      try {
        return JSON.parse(textResponse)
      } catch (error) {
        return textResponse
      }
    })
    .then((responseData) => {
      callback(null, responseData)
    })
    .catch(() => {
      const myError = new Meteor.Error(500, 'Cannot access the API')
      callback(myError, null)
    })
}

export const makeTxHumanReadable = async (item) => {
  // Add null/undefined check for Meteor 3.x compatibility
  if (!item) {
    console.log('ERROR: item is null or undefined in makeTxHumanReadable')
    return null
  }

  let output

  // Check if this is a getObject response (has 'found' property) or raw transaction data
  if (Object.prototype.hasOwnProperty.call(item, 'found')) {
    // This is a getObject response
    if (item.found !== false) {
      // Add defensive checks for nested properties
      if (item.transaction && item.transaction.tx && item.transaction.tx.transactionType === 'transfer_token') {
        try {
          // Request Token Decimals / Symbol
          const symbolRequest = {
            query: item.transaction.tx.transfer_token.token_txhash,
          }
          const thisSymbolResponse = await getObjectAsync(symbolRequest)
          if (thisSymbolResponse) {
            output = helpers.parseTokenAndTransferTokenTx(thisSymbolResponse, item)
          } else {
            console.log('WARNING: thisSymbolResponse is null, falling back to helpers.txhash')
            output = helpers.txhash(item)
          }
        } catch (e) {
          console.log('ERROR in makeTxHumanReadable', e)
          output = helpers.txhash(item)
        }
      } else {
        output = helpers.txhash(item)
      }
    } else {
      // Transaction not found
      return item
    }
  } else {
    // This is raw transaction data (from transaction lists)
    // Process it directly with helpers.txhash
    try {
      if (item.transaction && item.transaction.tx && item.transaction.tx.transactionType === 'transfer_token') {
        // For transfer_token transactions, we need to get token details
        const symbolRequest = {
          query: item.transaction.tx.transfer_token.token_txhash,
        }
        const thisSymbolResponse = await getObjectAsync(symbolRequest)
        if (thisSymbolResponse) {
          output = helpers.parseTokenAndTransferTokenTx(thisSymbolResponse, item)
        } else {
          output = helpers.txhash(item)
        }
      } else {
        output = helpers.txhash(item)
      }
    } catch (e) {
      console.log('ERROR processing raw transaction data:', e)
      output = helpers.txhash(item)
    }
  }

  return output
}

export const makeTxListHumanReadable = async (txList, confirmed) => {
  const outputList = []

  for (const item of txList) {
    // Add a transaction object to the returned transaction so we can use txhash helper
    const output = await makeTxHumanReadable({ transaction: item })
    // Now put it back
    if (output && output.transaction) {
      if (confirmed) {
        output.transaction.tx.confirmed = 'true'
      } else {
        output.transaction.tx.confirmed = 'false'
      }
      outputList.push(output.transaction)
    }
  }

  return outputList
}

Meteor.methods({
  async QRLvalue() {
    console.log('QRLvalue method called')
    this.unblock()
    const priceData = await quantausd.findOneAsync({})
    console.log(priceData)
    if (!priceData || !priceData.price) {
      console.log('No price data available')
      return 0
    }
    return priceData.price
  },

  async status() {
    console.log('status method called')
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const response = await getStatsAsync({})
    return response
  },

  async lastblocks() {
    console.log('lastblocks method called')
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const response = await getLatestDataAsync({
      filter: 'BLOCKHEADERS',
      offset: 0,
      quantity: 5,
    })
    return response
  },

  async lastunconfirmedtx() {
    console.log('lastunconfirmedtx method called')
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const response = await getLatestDataAsync({
      filter: 'TRANSACTIONS_UNCONFIRMED',
      offset: 0,
      quantity: 5,
    })
    const unconfirmedReadable = await makeTxListHumanReadable(
      response.transactions_unconfirmed,
      false,
    )
    response.transactions_unconfirmed = unconfirmedReadable
    return response
  },

  async txhash(txId) {
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
      const queryResults = await blockData.findOneAsync({ txId })
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
      const response = await getObjectAsync(req)

      // Handle null response
      if (!response) {
        throw new Meteor.Error(404, `Transaction ${txId} not found or API returned null response`)
      }

      const formattedData = await makeTxHumanReadable(response)
      try {
        if (formattedData && formattedData.transaction && formattedData.transaction.header !== null) {
          // not unconfirmed so insert into cache
          await updateAutoIncrement()
          await blockData.insertAsync({ txId, formattedData })
        }
      } catch (e) {
        console.log('Null Tx ignored')
      }
      // return to client
      return formattedData
    }
  },

  async block(blockId) {
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
      const queryResults = await blockData.findOneAsync({ blockId })
      if (queryResults !== undefined) {
        // cached transaction located
        console.log(`** INFO ** Returning cached data for block ${blockId}`)
        return queryResults.formattedData
      }

      // asynchronous call to API using getObjectAsync
      const req = {
        query: Buffer.from(blockId.toString()),
      }
      let response
      try {
        response = await getObjectAsync(req)
      } catch (error) {
        console.log(`Error fetching block ${blockId}:`, error.message)
        throw error
      }

      // Check if response is valid
      if (!response || !response.block_extended) {
        const errorCode = 404
        const errorMessage = `Block ${blockId} not found or invalid response from API`
        console.log(`Error: ${errorMessage}`)
        throw new Meteor.Error(errorCode, errorMessage)
      }

      // Refactor for block_extended and extended_transactions
      response.block = response.block_extended
      response.block.transactions = response.block_extended.extended_transactions

      // Process all address fields in the entire response
      response = bufferToHex(response)

      if (response.block.header) {
        // transactions
        const transactions = []
        for (const value of response.block.transactions) {
          const adjusted = value.tx
          // Copy addr_from from TransactionExtended wrapper to the tx object
          adjusted.addr_from = value.addr_from
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
            adjusted.transfer.totalTransferred = thisTotalTransferred / SHOR_PER_QUANTA
            adjusted.transfer.totalOutputs = totalOutputs
          }
          if (adjusted.transactionType === 'transfer_token') {
            let thisSymbol = 'TOKEN'
            let thisDecimals = 0
            let thisSymbolResponse = null

            // Request token decimals/symbol, but do not fail the entire block if lookup errors
            try {
              const symbolRequest = {
                query: Buffer.from(adjusted.transfer_token.token_txhash, 'hex'),
              }
              thisSymbolResponse = await getObjectAsync(symbolRequest)
              if (
                thisSymbolResponse
                && thisSymbolResponse.transaction
                && thisSymbolResponse.transaction.tx
                && thisSymbolResponse.transaction.tx.token
              ) {
                // eslint-disable-next-line
                thisSymbol = Buffer.from(
                  thisSymbolResponse.transaction.tx.token.symbol,
                ).toString()
                thisDecimals = Number(thisSymbolResponse.transaction.tx.token.decimals) || 0
              }
            } catch (error) {
              console.log(
                `Error fetching token metadata for block ${blockId}:`,
                error.reason || error.message || error,
              )
            }

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
            if (
              thisSymbolResponse
              && thisSymbolResponse.transaction
              && thisSymbolResponse.transaction.tx
              && thisSymbolResponse.transaction.tx.token
            ) {
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
          }
          transactions.push(adjusted)
        }

        response.block.transactions = transactions
      }
      // insert into cache
      await updateAutoIncrement()
      await blockData.insertAsync({ blockId, formattedData: response })
      return response
    }
  },

  async addressTransactions(request) {
    check(request, Match.ObjectIncluding({ tx: [Match.ObjectIncluding({ txhash: String })] }))
    // Cap array size to prevent resource exhaustion (UI sends pages of ~10)
    if (request.tx.length > 20) {
      throw new Meteor.Error(400, 'Too many transactions requested (max 20)')
    }
    // Validate each txhash is a 64-char hex string before making gRPC calls
    const hexPattern = /^[0-9a-fA-F]{64}$/
    for (const item of request.tx) {
      if (!hexPattern.test(item.txhash)) {
        throw new Meteor.Error(400, 'Invalid transaction hash format')
      }
    }
    console.log(
      `addressTransactions method called for ${request.tx.length} transactions`,
    )
    const targets = request.tx
    const result = []
    for (const arr of targets) {
      const req = { query: Buffer.from(arr.txhash, 'hex') }
      try {
        const thisTxnHashResponse = await getObjectAsync(req)

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
          const thisSymbolResponse = await getObjectAsync(symbolRequest)
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
            fee: output.transaction.tx.fee,
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
    }
    return result
  },

  async getStats(request = {}) {
    check(request, Match.Optional(Object))
    this.unblock()
    const response = await getStatsAsync(request)
    return response
  },

  async getObject(request) {
    check(request, Match.ObjectIncluding({ query: Match.Any }))
    this.unblock()
    const response = await getObjectAsync(request)
    return response
  },

  async getLatestData(request) {
    check(request, Match.ObjectIncluding({ filter: String, offset: Match.Integer, quantity: Match.Integer }))
    this.unblock()
    const response = await getLatestDataAsync(request)
    return response
  },

  async getAddressState(request) {
    check(request, Match.ObjectIncluding({ address: Match.Any }))
    this.unblock()
    const response = await getAddressStateAsync(request)
    return response
  },

  async getFullAddressState(request) {
    check(request, Match.ObjectIncluding({ address: Match.Any }))
    this.unblock()
    const response = await getFullAddressStateAsync(request)
    return response
  },

  async getMultiSigAddressState(request) {
    check(request, Match.ObjectIncluding({ address: Match.Any }))
    this.unblock()
    const response = await getMultiSigAddressStateAsync(request)
    return response
  },

  async getOTS(request) {
    check(request, Match.ObjectIncluding({
      address: Match.Any, page_from: Match.Integer, page_count: Match.Integer, unused_ots_index_from: Match.Integer,
    }))
    this.unblock()
    const response = await getOTSAsync(request)
    return response
  },

  async getTransactionsByAddress(request) {
    check(request, Match.ObjectIncluding({ address: Match.Any, item_per_page: Match.Integer, page_number: Match.Integer }))
    this.unblock()
    const response = await getTransactionsByAddressAsync(request)
    return await helpersaddressTransactions(response)
  },

  async getSlavesByAddress(request) {
    check(request, Match.ObjectIncluding({ address: Match.Any }))
    this.unblock()
    const response = await getSlavesByAddressAsync(request)
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

JsonRoutes.add('get', '/api/a/:id', async (req, res) => {
  if (!checkApiRateLimit(req)) {
    JsonRoutes.sendResult(res, { code: 429, data: { error: 'Rate limit exceeded', code: 4290 } })
    return
  }
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
        response = await getAddressStateAsync(request)
        response.isMultisig = false
      } else {
        response = await getMultiSigAddressStateAsync(request)
        response.isMultisig = true
      }
    } catch (e) {
      console.error('API /api/a/:id error:', e)
      response = { found: false, message: 'Error fetching address data', code: 5000 }
    }
  } else {
    response = { found: false, message: 'Invalid QRL address', code: 3000 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

async function apiTxList(req, res, num) {
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
        addressState = await getAddressStateAsync(addressStateRequest)
      } else {
        addressState = await getMultiSigAddressStateAsync(
          addressStateRequest,
        )
      }

      // Calculate total pages based on transaction count
      let totalTransactions = 0
      if (addressState && addressState.state && addressState.state.transaction_hashes) {
        totalTransactions = addressState.state.transaction_hashes.length
      } else if (
        addressState
        && addressState.state
        && addressState.state.transaction_hash_count
      ) {
        totalTransactions = parseInt(
          addressState.state.transaction_hash_count,
          10,
        )
      }
      totalPages = Math.ceil(totalTransactions / 10)

      const rawResponse = await getTransactionsByAddressAsync(request)
      const processedResponse = await helpersaddressTransactions(rawResponse)
      response = bufferToHex(processedResponse)
    } catch (e) {
      console.error('API /api/a/tx/:id error:', e)
      JsonRoutes.sendResult(res, {
        data: { found: false, message: 'Error fetching transaction list', code: 5003 },
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

JsonRoutes.add('get', '/api/a/tx/:id/:num', async (req, res) => {
  if (!checkApiRateLimit(req)) {
    JsonRoutes.sendResult(res, { code: 429, data: { error: 'Rate limit exceeded', code: 4290 } })
    return
  }
  const num = parseInt(req.params.num, 10) || 0
  if (num === 0) {
    // return that page number, if passed, must start with a 1
    JsonRoutes.sendResult(res, {
      data: { found: false, message: 'Invalid page number', code: 3003 },
    })
    return
  }
  await apiTxList(req, res, num)
})

JsonRoutes.add('get', '/api/a/tx/:id', async (req, res) => {
  if (!checkApiRateLimit(req)) {
    JsonRoutes.sendResult(res, { code: 429, data: { error: 'Rate limit exceeded', code: 4290 } })
    return
  }
  await apiTxList(req, res, 1)
})

JsonRoutes.add('get', '/api/tx/:id', async (req, res) => {
  if (!checkApiRateLimit(req)) {
    JsonRoutes.sendResult(res, { code: 429, data: { error: 'Rate limit exceeded', code: 4290 } })
    return
  }
  const txId = req.params.id
  check(txId, String)
  let response = {}
  if (txId.length === 64) {
    // first check this is not cached
    const queryResults = await blockData.findOneAsync({ txId })
    if (queryResults !== undefined) {
      // cached transaction located
      response = queryResults.formattedData
    } else {
      // cache empty, query grpc
      const request = { query: Buffer.from(txId, 'hex') }
      try {
        response = await getObjectAsync(request)
      } catch (e) {
        console.error('API /api/tx/:id error:', e)
        response = { found: false, message: 'Error fetching transaction data', code: 5001 }
      }
    }
  } else {
    response = { found: false, message: 'Invalid Txhash', code: 3001 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/block/:id', async (req, res) => {
  if (!checkApiRateLimit(req)) {
    JsonRoutes.sendResult(res, { code: 429, data: { error: 'Rate limit exceeded', code: 4290 } })
    return
  }
  const blockId = req.params.id
  check(blockId, String)
  let response = {}
  if (parseInt(blockId, 10).toString() === blockId) {
    // first check this is not cached
    const queryResults = await blockData.findOneAsync({ blockId: parseInt(blockId, 10) })
    if (queryResults !== undefined) {
      // cached block located
      response = queryResults.formattedData
    } else {
      // cache empty, query grpc using Promise pattern
      const request = { query: Buffer.from(blockId) }
      try {
        response = await new Promise((resolve, reject) => {
          getObject(request, (error, result) => {
            if (error) reject(error)
            else resolve(result)
          })
        })
      } catch (e) {
        console.error('API /api/block/:id error:', e)
        response = { found: false, message: 'Error fetching block data', code: 5002 }
      }
    }
  } else {
    response = { found: false, message: 'Invalid Block', code: 3002 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})
