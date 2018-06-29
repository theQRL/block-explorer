/* eslint max-len: 0 */
import { HTTP } from 'meteor/http'
import sha512 from 'sha512'
import { getLatestData, getObject, getStats, getPeersStat, apiCall } from '/imports/startup/server/index.js'
import { Blocks, lasttx, homechart, quantausd, status, peerstats } from '/imports/api/index.js'
import { SHOR_PER_QUANTA } from '../both/index.js'


const refreshBlocks = () => {
  const request = { filter: 'BLOCKHEADERS', offset: 0, quantity: 14 }
  const response = Meteor.wrapAsync(getLatestData)(request)

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
        thisTotalTransferred += parseInt(unconfirmed.transactions_unconfirmed[index].tx.transfer_token.amounts[aindex], 10)
      })
      // eslint-disable-next-line
      thisTotalTransferred = thisTotalTransferred / Math.pow(10, thisSymbolResponse.transaction.tx.token.decimals)
      unconfirmed.transactions_unconfirmed[index].tx.totalTransferred = thisTotalTransferred
    } else if (item.tx.transactionType === 'transfer') {
      // Calculate total transferred
      let thisTotalTransferred = 0
      _.each(unconfirmed.transactions_unconfirmed[index].tx.transfer.addrs_to, (thisAddress, aindex) => {
        // Now update total transferred with the corresponding amount from this output
        thisTotalTransferred += parseInt(unconfirmed.transactions_unconfirmed[index].tx.transfer.amounts[aindex], 10)
      })
      thisTotalTransferred /= SHOR_PER_QUANTA
      unconfirmed.transactions_unconfirmed[index].tx.totalTransferred = thisTotalTransferred
    }
  })

  // Now get confirmed transactions
  const confirmed = Meteor.wrapAsync(getLatestData)({ filter: 'TRANSACTIONS', offset: 0, quantity: 10 })
  confirmed.transactions.forEach((item, index) => {
    confirmed.transactions[index].tx.confirmed = 'true'
    if (item.tx.transactionType === 'token') {
      // Store plain text version of token symbol
      confirmed.transactions[index].tx.tokenSymbol =
        Buffer.from(item.tx.token.symbol).toString()
    } else if (item.tx.transactionType === 'transfer_token') {
      // Request Token Symbol
      const symbolRequest = {
        query: Buffer.from(item.tx.transfer_token.token_txhash, 'hex'),
      }
      const thisSymbolResponse = Meteor.wrapAsync(getObject)(symbolRequest)
      // Store symbol in response
      confirmed.transactions[index].tx.tokenSymbol =
        Buffer.from(thisSymbolResponse.transaction.tx.token.symbol).toString()
      confirmed.transactions[index].tx.tokenDecimals = thisSymbolResponse.transaction.tx.token.decimals

      // Calculate total transferred
      let thisTotalTransferred = 0
      _.each(confirmed.transactions[index].tx.transfer_token.addrs_to, (thisAddress, aindex) => {
        // Now update total transferred with the corresponding amount from this output
        thisTotalTransferred += parseInt(confirmed.transactions[index].tx.transfer_token.amounts[aindex], 10)
      })
      // eslint-disable-next-line
      thisTotalTransferred = thisTotalTransferred / Math.pow(10, thisSymbolResponse.transaction.tx.token.decimals)
      confirmed.transactions[index].tx.totalTransferred = thisTotalTransferred
    } else if (item.tx.transactionType === 'transfer') {
      // Calculate total transferred
      let thisTotalTransferred = 0
      _.each(confirmed.transactions[index].tx.transfer.addrs_to, (thisAddress, aindex) => {
        // Now update total transferred with the corresponding amount from this output
        thisTotalTransferred += parseInt(confirmed.transactions[index].tx.transfer.amounts[aindex], 10)
      })
      thisTotalTransferred /= SHOR_PER_QUANTA
      confirmed.transactions[index].tx.totalTransferred = thisTotalTransferred
    }
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
        if (Buffer.from(currentTxn.tx.transaction_hash).toString('hex') === Buffer.from(newTxn.tx.transaction_hash).toString('hex')) {
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
