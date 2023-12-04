/* eslint max-len: 0 */
/* global _ */
import { HTTP } from 'meteor/http'
import { JsonRoutes } from 'meteor/simple:json-routes'
import { SHA512 } from 'jscrypto/es6'
import axios from 'axios'
// import helpers from '@theqrl/explorer-helpers'
/* eslint import/no-cycle: 0 */
import {
  getLatestData,
  getObject,
  getStats,
  getPeersStat,
  // apiCall,
  makeTxListHumanReadable,
} from '/imports/startup/server/index.js'

import {
  Blocks,
  lasttx,
  homechart,
  quantausd,
  status,
  peerstats,
} from '/imports/api/index.js'

import { SHOR_PER_QUANTA } from '../both/index.js'

const refreshBlocks = () => {
  const request = { filter: 'BLOCKHEADERS', offset: 0, quantity: 10 }
  const response = Meteor.wrapAsync(getLatestData)(request)

  // identify miner and calculate total transacted in block
  response.blockheaders.forEach((value, key) => {
    const req = {
      query: Buffer.from(value.header.block_number.toString()),
    }
    const res = Meteor.wrapAsync(getObject)(req)
    let totalTransacted = 0
    res.block_extended.extended_transactions.forEach((val) => {
      totalTransacted += parseInt(val.tx.fee, 10)

      if (val.tx.transactionType === 'coinbase') {
        response.blockheaders[key].minedBy = val.tx.coinbase.addr_to
        totalTransacted += parseInt(val.tx.coinbase.amount, 10)
      }
      if (val.tx.transactionType === 'transfer') {
        val.tx.transfer.amounts.forEach((xferAmount) => {
          totalTransacted += parseInt(xferAmount, 10)
        })
      }
    })
    response.blockheaders[key].totalTransacted = totalTransacted
  })

  // Fetch current data
  const current = Blocks.findOne()

  // On vanilla build, current will be undefined so we can just insert data
  if (current === undefined) {
    Blocks.insert(response)
  } else {
    // Only update if data has changed.
    let newData = false
    _.each(response.blockheaders, (newBlock) => {
      let thisFound = false
      _.each(current.blockheaders, (currentBlock) => {
        if (currentBlock.header.block_number === newBlock.header.block_number) {
          thisFound = true
        }
      })
      if (thisFound === false) {
        newData = true
      }
    })
    if (newData === true) {
      // Clear and update cache as it's changed
      Blocks.remove({})
      Blocks.insert(response)
    }
  }

  const lastblocktime = response.blockheaders[4].header.timestamp_seconds
  const seconds = new Date().getTime() / 1000
  const timeDiff = Math.floor((seconds - lastblocktime) / 60)
  // needs refactor
  if (timeDiff > 100000) {
    const httpPostMessage = {
      icon: 'https://vignette.wikia.nocookie.net/fantendo/images/3/3d/HC_Minion_Icon.png/revision/latest?cb=20140211171359',
      title: 'Block Explorer Warning',
      body: `**WARNING:** ${timeDiff} minutes since last block`,
    }
    // if there is a Glip webhook, post an alert to Glip
    try {
      if (
        Meteor.settings.glip.webhook.slice(0, 23) === 'https://hooks.glip.com/'
      ) {
        const httpPostUrl = Meteor.settings.glip.webhook
        try {
          HTTP.call('POST', httpPostUrl, {
            params: httpPostMessage,
          })
          return true
        } catch (e) {
          // Got a network error, timeout, or HTTP error in the 400 or 500 range.
        }
      }
    } catch (er) {
      // the glip variable isn't defined (i.e. block explorer started without a config file)
    }
    console.log(`**WARNING:** ${timeDiff} minutes since last block`) // eslint-disable-line
  }
  return true
}

function refreshLasttx() {
  // First get confirmed transactions
  const confirmed = Meteor.wrapAsync(getLatestData)({
    filter: 'TRANSACTIONS',
    offset: 0,
    quantity: 10,
  })

  // Now get unconfirmed transactions
  const unconfirmed = Meteor.wrapAsync(getLatestData)({
    filter: 'TRANSACTIONS_UNCONFIRMED',
    offset: 0,
    quantity: 10,
  })

  // Merge the two together
  const confirmedTxns = makeTxListHumanReadable(confirmed.transactions, true)
  const unconfirmedTxns = makeTxListHumanReadable(
    unconfirmed.transactions_unconfirmed,
    false,
  )
  const merged = {}
  merged.transactions = unconfirmedTxns.concat(confirmedTxns)

  // Fetch current data
  const current = lasttx.findOne()

  // On vanilla build, current will be undefined so we can just insert data
  if (current === undefined) {
    lasttx.insert(merged)
  } else {
    // Only update if data has changed.
    let newData = false
    _.each(merged.transactions, (newTxn) => {
      let thisFound = false
      _.each(current.transactions, (currentTxn) => {
        // Find a matching pair of transactions by transaction hash
        if (currentTxn.tx.transaction_hash === newTxn.tx.transaction_hash) {
          try {
            // If they both have null header (unconfirmed) there is no change
            if (currentTxn.header === null && newTxn.header === null) {
              thisFound = true
              // If they have same block number, there is also no change.
            } else if (
              currentTxn.header.block_number === newTxn.header.block_number
            ) {
              thisFound = true
            }
          } catch (e) {
            // Header in cached unconfirmed txn not found, we located a change
            thisFound = false
          }
        }
      })
      if (thisFound === false) {
        newData = true
      }
    })

    if (newData === true) {
      // Clear and update cache as it's changed
      lasttx.remove({})
      lasttx.insert(merged)
    }
  }
}

function refreshStats() {
  const res = Meteor.wrapAsync(getStats)({ include_timeseries: true })

  // Save status object
  status.remove({})
  status.insert(res)

  // Start modifying data for home chart object
  const chartLineData = {
    labels: [],
    datasets: [],
  }

  // Create chart axis objects
  const labels = []
  const hashPower = {
    label: 'Hash Power (hps)',
    borderColor: '#FFA729',
    backgroundColor: '#FFA729',
    fill: false,
    data: [],
    yAxisID: 'y-axis-2',
    pointRadius: 0,
    borderWidth: 2,
  }
  const difficulty = {
    label: 'Difficulty',
    borderColor: '#B7DFFF',
    backgroundColor: '#B7DFFF',
    fill: false,
    data: [],
    yAxisID: 'y-axis-2',
    pointRadius: 0,
    borderWidth: 2,
  }
  const movingAverage = {
    label: 'Block Time Average (s)',
    borderColor: '#4AAFFF',
    backgroundColor: '#4AAFFF',
    fill: false,
    data: [],
    yAxisID: 'y-axis-1',
    pointRadius: 0,
    borderWidth: 2,
  }
  const blockTime = {
    label: 'Block Time (s)',
    borderColor: '#6D7478',
    backgroundColor: '#6D7478',
    fill: false,
    showLine: false,
    data: [],
    yAxisID: 'y-axis-1',
    pointRadius: 1,
    borderWidth: 0,
  }

  // Loop all API responses and push data into axis objects
  //
  //  number: '546281',
  //  difficulty: '2244',
  //  timestamp: '1701439377',
  //  time_last: '7',
  //  time_movavg: '66',
  //  hash_power: 2040,
  //  header_hash: <Buffer f9 58 74 08 8f 76 2c 0f 0b e5 52 9b 86 c8 c5 90 98 92 cb 29 2e e2 30 df 7c 1c 20 fa 35 94 08 00>,
  //  header_hash_prev: <Buffer d1 4f f2 13 d2 36 15 f3 c2 4f 37 a7 53 88 17 db c4 3d 7c fa cc 6b 05 68 34 ea 38 dd 01 4e 01 00>
  //

  _.each(res.block_timeseries, (entry) => {
    labels.push([entry.number, entry.timestamp])
    // labels.push(entry.timestamp)
    hashPower.data.push(entry.hash_power)
    difficulty.data.push(entry.difficulty)
    movingAverage.data.push(entry.time_movavg)
    blockTime.data.push(entry.time_last)
  })

  // Push axis objects into chart data
  chartLineData.labels = labels
  chartLineData.datasets.push(hashPower)
  chartLineData.datasets.push(difficulty)
  chartLineData.datasets.push(movingAverage)
  chartLineData.datasets.push(blockTime)
  // Save in mongo
  homechart.remove({})
  homechart.insert(chartLineData)
}

const refreshQuantaUsd = async () => {
  const apiUrl = 'https://market-data.automated.theqrl.org/'
  const response = await axios.get(apiUrl)
  const { price } = response.data
  quantausd.remove({})
  quantausd.insert({ price })
}

const refreshPeerStats = () => {
  const response = Meteor.wrapAsync(getPeersStat)({})

  // Convert bytes to string in response object
  _.each(response.peers_stat, (peer, index) => {
    response.peers_stat[index].peer_ip = SHA512.hash(
      Buffer.from(peer.peer_ip).toString(),
    )
      .toString()
      .toString('hex')
      .slice(0, 10)
    response.peers_stat[index].node_chain_state.header_hash = Buffer.from(
      peer.node_chain_state.header_hash,
    ).toString('hex')
    response.peers_stat[index].node_chain_state.cumulative_difficulty = parseInt(
      Buffer.from(peer.node_chain_state.cumulative_difficulty).toString(
        'hex',
      ),
      16,
    )
  })

  // Update mongo collection
  peerstats.remove({})
  peerstats.insert(response)
}

// Refresh blocks every 20 seconds
Meteor.setInterval(() => {
  refreshBlocks()
}, 20000)

// Refresh lasttx cache every 10 seconds
Meteor.setInterval(() => {
  refreshLasttx()
}, 10000)

// Refresh Status / Home Chart Data 20 seconds
Meteor.setInterval(() => {
  refreshStats()
}, 20000)

// Refresh Quanta/USD Value every 120 seconds
Meteor.setInterval(() => {
  refreshQuantaUsd()
}, 120000)

// Refresh peer stats every 20 seconds
Meteor.setInterval(() => {
  refreshPeerStats()
}, 20000)

// On first load - cache all elements.
Meteor.setTimeout(() => {
  refreshBlocks()
  refreshLasttx()
  refreshStats()
  refreshQuantaUsd()
  refreshPeerStats()
}, 5000)

JsonRoutes.add('get', '/api/emission', (req, res) => {
  let response = {}
  const queryResults = status.findOne()
  if (queryResults !== undefined) {
    // cached transaction located
    const emission = parseInt(queryResults.coins_emitted, 10) / SHOR_PER_QUANTA
    response = { found: true, emission }
  } else {
    response = { found: false, message: 'API error', code: 5001 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/emission/text', (req, res) => {
  let response = {}
  const queryResults = status.findOne()
  if (queryResults !== undefined) {
    // cached transaction located
    const emission = parseInt(queryResults.coins_emitted, 10) / SHOR_PER_QUANTA
    response = emission
  } else {
    response = 'Error'
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/reward', (req, res) => {
  let response = {}
  const queryResults = status.findOne()
  if (queryResults !== undefined) {
    // cached transaction located
    const reward = parseFloat(queryResults.block_last_reward) / SHOR_PER_QUANTA
    response = { found: true, reward }
  } else {
    response = { found: false, message: 'API error', code: 5002 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/reward/text', (req, res) => {
  let response = {}
  const queryResults = status.findOne()
  if (queryResults !== undefined) {
    // cached transaction located
    const reward = parseFloat(queryResults.block_last_reward) / SHOR_PER_QUANTA
    response = reward
  } else {
    response = 'Error'
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/rewardshor', (req, res) => {
  let response = {}
  const queryResults = status.findOne()
  if (queryResults !== undefined) {
    // cached transaction located
    const reward = parseFloat(queryResults.block_last_reward)
    response = { found: true, reward }
  } else {
    response = { found: false, message: 'API error', code: 5002 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/rewardshor/text', (req, res) => {
  let response = {}
  const queryResults = status.findOne()
  if (queryResults !== undefined) {
    // cached transaction located
    const reward = parseFloat(queryResults.block_last_reward)
    response = reward
  } else {
    response = 'Error'
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/blockheight', (req, res) => {
  let response = {}
  const queryResults = status.findOne()
  if (queryResults !== undefined) {
    // cached transaction located
    const blockheight = parseInt(queryResults.node_info.block_height, 10)
    response = { found: true, blockheight }
  } else {
    response = { found: false, message: 'API error', code: 5002 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/blockheight/text', (req, res) => {
  let response = {}
  const queryResults = status.findOne()
  if (queryResults !== undefined) {
    // cached transaction located
    const blockheight = parseInt(queryResults.node_info.block_height, 10)
    response = blockheight
  } else {
    response = 'Error'
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/status', (req, res) => {
  let response = {}
  const queryResults = status.findOne()
  if (queryResults !== undefined) {
    // cached transaction located
    response = queryResults
  } else {
    response = { found: false, message: 'API error', code: 5003 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/miningstats', (req, res) => {
  let response = {}
  const queryResults = homechart.findOne()
  if (queryResults !== undefined) {
    response = {
      block: queryResults.labels[queryResults.labels.length - 1],
      hashrate: queryResults.datasets[0].data[queryResults.labels.length - 1],
      difficulty: queryResults.datasets[1].data[queryResults.labels.length - 1],
      blocktime: queryResults.datasets[2].data[queryResults.labels.length - 1],
    }
  } else {
    response = { found: false, message: 'API error', code: 5003 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})
