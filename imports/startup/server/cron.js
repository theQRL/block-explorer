/* eslint max-len: 0 */
import { HTTP } from 'meteor/http'
import sha512 from 'sha512'
import { getLatestData, getObject, getStats, getPeersStat, apiCall } from '/imports/startup/server/index.js'
import { Blocks, lasttx, homechart, quantausd, status, peerstats } from '/imports/api/index.js'
import { SHOR_PER_QUANTA } from '../both/index.js'
import helpers from '@theqrl/explorer-helpers'


const refreshBlocks = () => {
  const request = { filter: 'BLOCKHEADERS', offset: 0, quantity: 14 }
  const response = Meteor.wrapAsync(getLatestData)(request)


  // add miner
  response.blockheaders.forEach((value, key) => {
    const req = {
      query: Buffer.from(value.header.block_number.toString()),
    }
    const res = Meteor.wrapAsync(getObject)(req)
    res.block_extended.extended_transactions.forEach((val) => {
      if (val.tx.transactionType === 'coinbase') {
        response.blockheaders[key].minedBy = `Q${Buffer.from(val.tx.coinbase.addr_to).toString('hex')}`
      }
    })
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
      if (Meteor.settings.glip.webhook.slice(0, 23) === 'https://hooks.glip.com/') {
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
  // First get unconfirmed transactions
  const unconfirmed = Meteor.wrapAsync(getLatestData)({ filter: 'TRANSACTIONS_UNCONFIRMED', offset: 0, quantity: 10 })
  unconfirmed.transactions_unconfirmed.forEach((item, index) => {
    // Add a transaction object to the returned transaction so we can use txhash helper
    var temp = []
    temp.transaction = unconfirmed.transactions_unconfirmed[index]

    // Parse the transaction
    const output = helpers.txhash(temp)

    // Now put it back
    unconfirmed.transactions_unconfirmed[index] = output.transaction
    unconfirmed.transactions_unconfirmed[index].tx.confirmed = 'false'
  })

  // Now get confirmed transactions
  const confirmed = Meteor.wrapAsync(getLatestData)({ filter: 'TRANSACTIONS', offset: 0, quantity: 10 })
  confirmed.transactions.forEach((item, index) => {
    // Add a transaction object to the returned transaction so we can use txhash helper
    var temp = []
    temp.transaction = confirmed.transactions[index]

    // Parse the transaction
    const output = helpers.txhash(temp)

    // Now put it back
    confirmed.transactions[index] = output.transaction
    confirmed.transactions[index].tx.confirmed = 'true'
  })

  // Merge the two together
  const confirmedTxns = confirmed.transactions
  const unconfirmedTxns = unconfirmed.transactions_unconfirmed
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
        if (currentTxn.tx.transaction_hash == newTxn.tx.transaction_hash) {
          try {
            // If they both have null header (unconfirmed) there is no change
            if ((currentTxn.header === null) && (newTxn.header === null)) {
              thisFound = true
            // If they have same block number, there is also no change.
            } else if (currentTxn.header.block_number === newTxn.header.block_number) {
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
    borderColor: '#DC255D',
    backgroundColor: '#DC255D',
    fill: false,
    data: [],
    yAxisID: 'y-axis-2',
    pointRadius: 0,
    borderWidth: 2,
  }
  const difficulty = {
    label: 'Difficulty',
    borderColor: '#4A90E2',
    backgroundColor: '#4A90E2',
    fill: false,
    data: [],
    yAxisID: 'y-axis-2',
    pointRadius: 0,
    borderWidth: 2,
  }
  const movingAverage = {
    label: 'Block Time Average (s)',
    borderColor: '#0A0724',
    backgroundColor: '#0A0724',
    fill: false,
    data: [],
    yAxisID: 'y-axis-1',
    pointRadius: 0,
    borderWidth: 2,
  }
  const blockTime = {
    label: 'Block Time (s)',
    borderColor: '#1EE9CB',
    backgroundColor: '#1EE9CB',
    fill: false,
    showLine: false,
    data: [],
    yAxisID: 'y-axis-1',
    pointRadius: 2,
    borderWidth: 2,
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
  chartLineData.datasets.push(movingAverage)
  chartLineData.datasets.push(blockTime)

  // Save in mongo
  homechart.remove({})
  homechart.insert(chartLineData)
}

const refreshQuantaUsd = () => {
  const apiUrl = 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=btc-qrl'
  const apiUrlUSD = 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=usdt-btc'
  const response = Meteor.wrapAsync(apiCall)(apiUrl)
  const responseUSD = Meteor.wrapAsync(apiCall)(apiUrlUSD)
  const usd = response.result[0].Last * responseUSD.result[0].Last
  const price = { price: usd }
  quantausd.remove({})
  quantausd.insert(price)
}

const refreshPeerStats = () => {
  const response = Meteor.wrapAsync(getPeersStat)({})

  // Convert bytes to string in response object
  _.each(response.peers_stat, (peer, index) => {
    response.peers_stat[index].peer_ip =
      sha512(Buffer.from(peer.peer_ip).toString()).toString('hex').slice(0, 10)
    response.peers_stat[index].node_chain_state.header_hash =
      Buffer.from(peer.node_chain_state.header_hash).toString('hex')
    response.peers_stat[index].node_chain_state.cumulative_difficulty =
      parseInt(Buffer.from(peer.node_chain_state.cumulative_difficulty).toString('hex'), 16)
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
