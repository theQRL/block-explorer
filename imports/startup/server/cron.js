/* eslint max-len: 0 */
/* global _ */
import { JsonRoutes } from 'meteor/simple:json-routes'
import { SHA512 } from 'jscrypto/es6'
// import helpers from '@theqrl/explorer-helpers'
/* eslint import/no-cycle: 0 */
import {
  getLatestDataAsync,
  getObjectAsync,
  getStatsAsync,
  getPeersStatAsync,
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

import axios from 'axios'
import { SHOR_PER_QUANTA } from '../both/index.js'

const refreshBlocks = async () => {
  let response
  try {
    const request = { filter: 'BLOCKHEADERS', offset: 0, quantity: 10 }
    response = await getLatestDataAsync(request)
  } catch (error) {
    console.log('refreshBlocks: ERROR =', error.message || error.reason)
    return
  }

  // Check if response is valid
  if (!response || !response.blockheaders) {
    console.log('refreshBlocks: No blockheaders data received')
    return
  }

  // identify miner and calculate total transacted in block
  for (const [key, value] of response.blockheaders.entries()) {
    const req = {
      query: Buffer.from(value.header.block_number.toString()),
    }
    let res
    try {
      res = await getObjectAsync(req)
    } catch (error) {
      console.log(`refreshBlocks: Error fetching block ${value.header.block_number}:`, error.message)
      continue
    }

    // Check if the response has the expected structure
    if (!res || !res.block_extended || !res.block_extended.extended_transactions) {
      console.log(`refreshBlocks: Invalid block structure for block ${value.header.block_number}`)
      continue
    }

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
  }

  // Fetch current data
  const current = await Blocks.findOneAsync()

  // On vanilla build, current will be undefined so we can just insert data
  if (current === undefined) {
    await Blocks.insertAsync(response)
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
      await Blocks.removeAsync({})
      await Blocks.insertAsync(response)
    }
  }

  const lastHeader = response.blockheaders[
    Math.min(4, response.blockheaders.length - 1)
  ]
  if (!lastHeader || !lastHeader.header) {
    return true
  }
  const lastblocktime = lastHeader.header.timestamp_seconds
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
          const alertResponse = await fetch(httpPostUrl, {
            method: 'POST',
            headers: {
              'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            body: new URLSearchParams(httpPostMessage).toString(),
          })
          if (!alertResponse.ok) {
            throw new Error(`HTTP ${alertResponse.status}`)
          }
          return true
        } catch (e) {
          console.log('refreshBlocks: Glip webhook error:', e.message || e.reason || e)
        }
      }
    } catch (er) {
      // the glip variable isn't defined (i.e. block explorer started without a config file)
    }
    console.log(`**WARNING:** ${timeDiff} minutes since last block`) // eslint-disable-line
  }
  return true
}

async function refreshLasttx() {
  let confirmed; let
    unconfirmed

  try {
    // First get confirmed transactions
    confirmed = await getLatestDataAsync({
      filter: 'TRANSACTIONS',
      offset: 0,
      quantity: 10,
    })

    // Now get unconfirmed transactions
    unconfirmed = await getLatestDataAsync({
      filter: 'TRANSACTIONS_UNCONFIRMED',
      offset: 0,
      quantity: 10,
    })
  } catch (error) {
    console.log('refreshLasttx: ERROR =', error.message || error.reason)
    return
  }

  // Check if responses are valid
  if (!confirmed || !confirmed.transactions || !unconfirmed || !unconfirmed.transactions_unconfirmed) {
    console.log('refreshLasttx: Invalid response data')
    return
  }

  // Merge the two together
  const confirmedTxns = await makeTxListHumanReadable(confirmed.transactions, true)
  const unconfirmedTxns = await makeTxListHumanReadable(
    unconfirmed.transactions_unconfirmed,
    false,
  )
  const merged = {}
  merged.transactions = unconfirmedTxns.concat(confirmedTxns)

  // Fetch current data
  const current = await lasttx.findOneAsync()

  // On vanilla build, current will be undefined so we can just insert data
  if (current === undefined) {
    await lasttx.insertAsync(merged)
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
      await lasttx.removeAsync({})
      await lasttx.insertAsync(merged)
    }
  }
}

async function refreshStats() {
  let res
  try {
    console.log('refreshStats: Starting...')
    res = await getStatsAsync({ include_timeseries: true })
    console.log('refreshStats: Got data:', res ? 'YES' : 'NO')
    if (res && res.block_timeseries) {
      console.log('refreshStats: block_timeseries length:', res.block_timeseries.length)
    } else {
      console.log('refreshStats: No block_timeseries data')
      return
    }
  } catch (error) {
    console.error('refreshStats: Error:', error.message)
    return
  }

  console.log('refreshStats: Processing data...')

  // Save status object
  await status.removeAsync({})
  await status.insertAsync(res)

  // Start modifying data for home chart object
  const chartLineData = {
    labels: [],
    datasets: [],
  }

  // Create chart axis objects
  const labels = []
  const hashPower = {
    label: 'Hash Power (hps)',
    borderColor: '#4AAFFF',
    backgroundColor: '#4AAFFF',
    fill: false,
    data: [],
    yAxisID: 'y-axis-2',
    pointRadius: 0,
    borderWidth: 2,
  }
  const difficulty = {
    label: 'Difficulty',
    borderColor: '#9CA3AF',
    backgroundColor: '#9CA3AF',
    fill: false,
    data: [],
    yAxisID: 'y-axis-2',
    pointRadius: 0,
    borderWidth: 2,
  }
  const movingAverage = {
    label: 'Block Time Average (s)',
    borderColor: '#FFA729',
    backgroundColor: '#FFA729',
    fill: false,
    data: [],
    yAxisID: 'y-axis-1',
    pointRadius: 0,
    borderWidth: 2,
  }
  const blockTime = {
    label: 'Block Time (s)',
    borderColor: '#B2751D',
    backgroundColor: '#B2751D',
    fill: false,
    showLine: false,
    data: [],
    yAxisID: 'y-axis-1',
    pointRadius: 1,
    borderWidth: 0,
  }

  // Loop all API responses and push data into axis objects
  _.each(res.block_timeseries, (entry) => {
    labels.push(entry.number)
    hashPower.data.push(entry.hash_power)
    difficulty.data.push(entry.difficulty)
    movingAverage.data.push(entry.time_movavg)
    blockTime.data.push(entry.time_last)
  })

  // Push axis objects into chart data
  chartLineData.labels = labels
  chartLineData.datasets.push(hashPower)
  chartLineData.datasets.push(difficulty)
  chartLineData.datasets.push(blockTime)
  chartLineData.datasets.push(movingAverage)

  // Save in mongo
  await homechart.removeAsync({})
  await homechart.insertAsync(chartLineData)
  console.log('refreshStats: Chart data inserted successfully')
}

const refreshQuantaUsd = async () => {
  const apiUrl = 'https://market-data.automated.theqrl.org/'
  let response

  try {
    response = await axios.get(apiUrl)
  } catch (error) {
    console.log('refreshQuantaUsd: ERROR =', error.message || error.reason)
    return
  }

  const price = Number(response && response.data ? response.data.price : null)
  if (!Number.isFinite(price)) {
    console.log('refreshQuantaUsd: Invalid market data response')
    return
  }

  await quantausd.removeAsync({})
  await quantausd.insertAsync({ price })
}

const refreshPeerStats = async () => {
  let response

  try {
    response = await getPeersStatAsync({})
  } catch (error) {
    console.log('refreshPeerStats: ERROR =', error.message || error.reason)
    return
  }

  // Check if response is valid
  if (!response || !response.peers_stat) {
    console.log('refreshPeerStats: No peers_stat data received')
    return
  }

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
  await peerstats.removeAsync({})
  await peerstats.insertAsync(response)
}

// Refresh blocks every 20 seconds
Meteor.setInterval(async () => {
  try {
    await refreshBlocks()
  } catch (error) {
    console.log('setInterval refreshBlocks error:', error.message || error.reason)
  }
}, 20000)

// Refresh lasttx cache every 10 seconds
Meteor.setInterval(async () => {
  try {
    await refreshLasttx()
  } catch (error) {
    console.log('setInterval refreshLasttx error:', error.message || error.reason)
  }
}, 10000)

// Refresh Status / Home Chart Data 20 seconds
Meteor.setInterval(async () => {
  try {
    await refreshStats()
  } catch (error) {
    console.log('setInterval refreshStats error:', error.message || error.reason)
  }
}, 20000)

// Refresh Quanta/USD Value every 120 seconds
Meteor.setInterval(async () => {
  try {
    await refreshQuantaUsd()
  } catch (error) {
    console.log('setInterval refreshQuantaUsd error:', error.message || error.reason)
  }
}, 120000)

// Refresh peer stats every 20 seconds
Meteor.setInterval(async () => {
  try {
    await refreshPeerStats()
  } catch (error) {
    console.log('setInterval refreshPeerStats error:', error.message || error.reason)
  }
}, 20000)

// On first load - cache all elements.
Meteor.setTimeout(async () => {
  const refreshTasks = [
    ['refreshBlocks', refreshBlocks],
    ['refreshLasttx', refreshLasttx],
    ['refreshStats', refreshStats],
    ['refreshQuantaUsd', refreshQuantaUsd],
    ['refreshPeerStats', refreshPeerStats],
  ]

  const results = await Promise.allSettled(
    refreshTasks.map(([, refreshFn]) => refreshFn()),
  )

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const [refreshName] = refreshTasks[index]
      const refreshError = result.reason || {}
      console.log(`Initial ${refreshName} error:`, refreshError.message || refreshError.reason || refreshError)
    }
  })
}, 5000)

JsonRoutes.add('get', '/api/emission', async (req, res) => {
  let response = {}
  const queryResults = await status.findOneAsync()
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

JsonRoutes.add('get', '/api/emission/text', async (req, res) => {
  let response = {}
  const queryResults = await status.findOneAsync()
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

JsonRoutes.add('get', '/api/reward', async (req, res) => {
  let response = {}
  const queryResults = await status.findOneAsync()
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

JsonRoutes.add('get', '/api/reward/text', async (req, res) => {
  let response = {}
  const queryResults = await status.findOneAsync()
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

JsonRoutes.add('get', '/api/rewardshor', async (req, res) => {
  let response = {}
  const queryResults = await status.findOneAsync()
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

JsonRoutes.add('get', '/api/rewardshor/text', async (req, res) => {
  let response = {}
  const queryResults = await status.findOneAsync()
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

JsonRoutes.add('get', '/api/blockheight', async (req, res) => {
  let response = {}
  const queryResults = await status.findOneAsync()
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

JsonRoutes.add('get', '/api/blockheight/text', async (req, res) => {
  let response = {}
  const queryResults = await status.findOneAsync()
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

JsonRoutes.add('get', '/api/status', async (req, res) => {
  let response = {}
  const queryResults = await status.findOneAsync()
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

JsonRoutes.add('get', '/api/miningstats', async (req, res) => {
  let response = {}
  const queryResults = await homechart.findOneAsync()
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
