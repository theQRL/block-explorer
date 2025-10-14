/* global jdenticon */
/* eslint no-console: 0 */
/* ^^^ remove once testing complete
 */
import JSONFormatter from 'json-formatter-js'
import qrlAddressValidator from '@theqrl/validate-qrl-address'
import _ from 'underscore'
import qrlNft from '@theqrl/nft-providers'
import { BigNumber } from 'bignumber.js'
import { rawAddressToB32Address, rawAddressToHexAddress } from '@theqrl/explorer-helpers'
import {
  bufferToHex,
  bytesToString, anyAddressToRaw, hexOrB32, numberToString, SHOR_PER_QUANTA, upperCaseFirst, decimalToBinary,
} from '../../../startup/both/index.js'
import './address.html'

BigNumber.config({ EXPONENTIAL_AT: 1e+9 })
let tokensHeld = []

// const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

const addressResultsRefactor = (res) => {
  // rewrite all arrays as strings (Q-addresses) or hex (hashes)
  const output = res
  /*
  if (res.state) {
    // output.state.address = ab2str(output.state.address)
    output.state.txcount = output.state.transaction_hashes.length

    // transactions
    const transactions = []
    output.state.transaction_hashes.forEach((value) => {
      transactions.push({ txhash: Buffer.from(value).toString('hex') })
    })
    output.state.transactions = transactions

    // pubhashes
    const pubhashes = []
    if (output.state.pubhashes) {
      output.state.pubhashes.forEach((value) => {
        const adjusted = Buffer.from(value).toString('hex')
        pubhashes.push(adjusted)
      })
      output.state.pubhashes = pubhashes
    }

    // txhashes
    const transactionHashes = []
    output.state.transaction_hashes.forEach((value) => {
      const adjusted = Buffer.from(value).toString('hex')
      transactionHashes.push(adjusted)
    })
    output.state.transaction_hashes = transactionHashes
  }
  */
  return output
}

async function parseOTS(obj) {
  console.log('parseOTS called with:', obj)
  
  if (!obj || typeof obj !== 'object') {
    console.error('parseOTS: Invalid object received:', obj)
    return '<div class="p-2 text-center text-xs text-red-400">No OTS data available</div>'
  }
  
  const k = Object.keys(obj).sort((a, b) => parseInt(a) - parseInt(b))
  console.log('parseOTS sorted keys:', k)
  console.log('parseOTS total keys:', k.length)
  
  if (k.length === 0) {
    console.log('parseOTS: No keys found in object')
    return '<div class="p-2 text-center text-xs text-gray-400">No OTS keys found</div>'
  }
  
  // Count used vs unused keys
  let usedCount = 0
  let unusedCount = 0
  k.forEach((val) => {
    if (obj[val] === 1) {
      usedCount++
    } else {
      unusedCount++
    }
  })
  
  console.log(`parseOTS: ${usedCount} used keys, ${unusedCount} unused keys`)
  
  let ret = ''
  
  k.forEach((val) => {
    let o = '<div class="p-1 sm:p-2 text-center text-xs sm:text-sm font-mono border rounded '
    if (obj[val] === 1) {
      o = `${o}bg-red-500/20 border-red-500/50 text-red-400`
      o = `${o}"><i data-lucide="x-circle" class="w-4 h-4 sm:w-4 sm:h-4 inline-block mr-1"></i>${val}</div>`
    } else {
      o = `${o}bg-green-500/20 border-green-500/50 text-green-400`
      o = `${o}"><i data-lucide="circle" class="w-4 h-4 sm:w-4 sm:h-4 inline-block mr-1"></i>${val}</div>`
    }
    ret = `${ret}${o}`
  })
  
  console.log('parseOTS returning:', ret)
  return ret
}

async function OTS(obj) {
  console.log('OTS function called with:', obj)
  
  if (!obj || typeof obj !== 'object') {
    console.error('OTS: Invalid object received:', obj)
    Session.set('OTStracker', '<div class="p-2 text-center text-xs text-red-400">No OTS data available</div>')
    return
  }
  
  const k = Object.keys(obj).sort((a, b) => parseInt(a) - parseInt(b))
  console.log('OTS sorted keys:', k)
  console.log('OTS total keys:', k.length)
  
  if (k.length === 0) {
    console.log('OTS: No keys found in object')
    Session.set('OTStracker', '<div class="p-2 text-center text-xs text-gray-400">No OTS keys found</div>')
    return
  }
  
  // Count used vs unused keys
  let usedCount = 0
  let unusedCount = 0
  k.forEach((val) => {
    if (obj[val] === 1) {
      usedCount++
    } else {
      unusedCount++
    }
  })
  
  console.log(`OTS: ${usedCount} used keys, ${unusedCount} unused keys`)
  
  // Generate clean HTML without any row breaking
  let cellsHTML = ''
  k.forEach((val) => {
    let cellClass = 'p-1 sm:p-2 text-center text-sm sm:text-base font-mono border rounded '
    let iconHTML = ''
    
    let tooltip = ''
    if (obj[val] === 1) {
      cellClass += 'bg-red-500/20 border-gray-500/30 text-red-400'
      iconHTML = '<i data-lucide="x-circle" class="w-2 h-2 sm:w-3 sm:h-3 inline-block mr-1"></i>'
      tooltip = `Key ${val}: USED`
    } else {
      cellClass += 'bg-green-500/20 border-gray-500/30 text-green-300'
      iconHTML = '<i data-lucide="circle" class="w-2 h-2 sm:w-3 sm:h-3 inline-block mr-1"></i>'
      tooltip = `Key ${val}: Available`
    }
    
    cellsHTML += `<div class="${cellClass}" title="${tooltip}">${iconHTML}${val}</div>\n`
  })
  
  console.log('Generated cells HTML:', cellsHTML)
  
  // Generate proper OTS cells with responsive grid (max 10 columns)
  const html = `
    <style>
      .ots-responsive-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 4px;
        width: 100%;
      }
      @media (min-width: 640px) {
        .ots-responsive-grid { grid-template-columns: repeat(8, 1fr); }
      }
      @media (min-width: 768px) {
        .ots-responsive-grid { grid-template-columns: repeat(10, 1fr); }
      }
      @media (min-width: 1024px) {
        .ots-responsive-grid { grid-template-columns: repeat(10, 1fr); }
      }
      @media (min-width: 1280px) {
        .ots-responsive-grid { grid-template-columns: repeat(10, 1fr); }
      }
    </style>
    <div class="ots-responsive-grid">${cellsHTML}</div>
  `
  console.log('Final OTS HTML:', html)
  Session.set('OTStracker', html)
  
  // Re-initialize Lucide icons for the new HTML
  if (window.reinitializeLucideIcons) {
    setTimeout(() => {
      window.reinitializeLucideIcons()
    }, 100)
  }
}

function loadAddressTransactions(aId, page) {
  Session.set('addressTransactions', [])
  $('#loadingTransactions').show()
  // console.log('Getting transactions for page ', page)
  const addresstx = anyAddressToRaw(aId)
  const request = {
    address: addresstx,
    item_per_page: 10,
    page_number: page,
  }

  Meteor.call('getTransactionsByAddress', request, (err, res) => {
    if (err) {
      Session.set('addressTransactions', { error: err })
    } else {
      Session.set('addressTransactions', res.transactions_detail)
      const a = Session.get('address')
      a.transactions = res.transactions_detail
      Session.set('address', a)
      Session.set('fetchedTx', true)
    }

    Meteor.call('getSlavesByAddress', request, (errSlaves, resSlaves) => {
      if (errSlaves) {
        // error handling
      } else {
        Session.set('slaves', resSlaves)
      }
    })

    $('#loadingTransactions').hide()
    $('#noTransactionsFound').show()
  })
}

const getTokenBalances = (getAddress, callback) => {
  const request = {
    address: anyAddressToRaw(getAddress),
  }

  Meteor.call('getFullAddressState', request, (err, res) => {
    if (err) {
      // TODO - Error handling
    } else {
      // Now for each res.state.token we find, go discover token name and symbol
      // eslint-disable-next-line
      if (res.state.address !== '') {
        const tokenKeys = Object.keys(res.state.tokens)

        // Limit the number of concurrent getObject calls to prevent backend overload
        const maxConcurrentCalls = 5
        let activeCalls = 0
        let processedTokens = 0
        const tokensToProcess = []

        // Queue all tokens for processing
        tokenKeys.forEach((key) => {
          tokensToProcess.push({
            tokenHash: key,
            tokenBalance: res.state.tokens[key],
          })
        })

        const processNextToken = () => {
          if (tokensToProcess.length === 0 || activeCalls >= maxConcurrentCalls) {
            return
          }

          const tokenData = tokensToProcess.shift()
          activeCalls++

          const req = {
            query: Buffer.from(tokenData.tokenHash, 'hex'),
          }

          Meteor.call('getObject', req, (objErr, objRes) => {
            activeCalls--
            processedTokens++

            if (objErr) {
              console.log('getObject error:', objErr)
            } else {
              // Check if this is a token hash.
              // eslint-disable-next-line
              if (objRes.transaction.tx.transactionType !== 'token') {
                // TODO - Error handling here
              } else {
                const tokenDetails = objRes.transaction.tx.token
                const thisToken = {}
                thisToken.hash = tokenData.tokenHash
                thisToken.name = bytesToString(tokenDetails.name)
                thisToken.symbol = bytesToString(tokenDetails.symbol) // eslint-disable-next-line
                thisToken.balance = tokenData.tokenBalance / Math.pow(10, tokenDetails.decimals)
                let nft = {}
                const symbol = Buffer.from(tokenDetails.symbol).toString(
                  'hex',
                )
                if (symbol.slice(0, 8) === '00ff00ff') {
                  const nftBytes = Buffer.concat([
                    Buffer.from(tokenDetails.symbol),
                    Buffer.from(tokenDetails.name),
                  ])
                  const idBytes = Buffer.from(nftBytes.slice(4, 8))
                  const cryptoHashBytes = Buffer.from(nftBytes.slice(8, 40))
                  const id = Buffer.from(idBytes).toString('hex')
                  const provider = `Q${Buffer.from(objRes.transaction.addr_from).toString('hex')}`
                  const providerDetails = {
                    known: false,
                  }
                  _.each(qrlNft.providers, (providerList) => {
                    if (providerList.id.slice(2, 10) === id) {
                      _.each(providerList.addresses, (address) => {
                        if (address === provider) {
                          providerDetails.known = true
                          providerDetails.name = providerList.name
                          providerDetails.url = providerList.url
                        }
                      })
                    }
                  })
                  nft = {
                    provider,
                    providerDetails,
                    txhash: Buffer.from(objRes.transaction.tx.transaction_hash).toString('hex'),
                    type: 'CREATE NFT',
                    id,
                    hash: Buffer.from(cryptoHashBytes).toString('hex'),
                  }
                  thisToken.nft = nft
                }
                tokensHeld.push(thisToken)
                Session.set('tokensHeld', tokensHeld)
              }
            }

            // Process next token if there are more in queue
            if (tokensToProcess.length > 0) {
              processNextToken()
            }

            // Check if all tokens have been processed
            if (processedTokens === tokenKeys.length) {
              callback()
              // When done hide loading section
              $('#loading').hide()
            }
          })

          // Start processing the next token
          processNextToken()
        }

        // Start processing tokens
        for (let i = 0; i < Math.min(maxConcurrentCalls, tokensToProcess.length); i++) {
          processNextToken()
        }
      } else {
        // Wallet not found, put together an empty response
        callback()
      }
    }
  })
}

const otsParse = (response, totalSignatures) => {
  console.log('otsParse called with response:', response)
  console.log('otsParse totalSignatures:', totalSignatures)
  
  // Parse OTS Bitfield, and grab the lowest unused key
  let newOtsBitfield = {}
  let thisOtsBitfield = []
  if (response.ots_bitfield_by_page[0].ots_bitfield !== undefined) {
    thisOtsBitfield = response.ots_bitfield_by_page[0].ots_bitfield
  }
  
  console.log('thisOtsBitfield:', thisOtsBitfield)
  
  thisOtsBitfield.forEach((item, index) => {
    const thisDecimal = new Uint8Array(item)[0]
    const thisBinary = decimalToBinary(thisDecimal).reverse()
    const startIndex = index * 8
    console.log(`Processing bitfield item ${index}: decimal=${thisDecimal}, binary=${thisBinary}, startIndex=${startIndex}`)
    
    for (let i = 0; i < 8; i += 1) {
      const thisOtsIndex = startIndex + i
      // Add to parsed array unless we have reached the end of the signatures
      if (thisOtsIndex < totalSignatures) {
        newOtsBitfield[thisOtsIndex] = thisBinary[i]
        console.log(`  OTS index ${thisOtsIndex}: ${thisBinary[i]}`)
      }
    }
  })
  
  console.log('newOtsBitfield before slice:', newOtsBitfield)
  console.log('newOtsBitfield length:', Object.keys(newOtsBitfield).length)
  console.log('totalSignatures:', totalSignatures)
  
  // Don't slice the bitfield - show all available data
  // if (newOtsBitfield.length > totalSignatures) {
  //   newOtsBitfield = newOtsBitfield.slice(0, totalSignatures + 1)
  // }

  // Add in OTS fields to response
  const ots = {}
  ots.keys = newOtsBitfield
  ots.nextKey = response.next_unused_ots_index
  console.log('otsParse returning:', ots)
  return ots
}

const renderAddressBlock = () => {
  const aId = upperCaseFirst(FlowRouter.getParam('aId'))
  let tPage = FlowRouter.getParam('tPage')
  tPage = parseInt(tPage, 10)
  if (!tPage) { tPage = 1 }
  // TODO: validate aId before constructing Method call
  if (aId) {
    const validate = qrlAddressValidator.hexString(aId)
    if (validate.result === false) { return }
    const req = {
      address: anyAddressToRaw(aId),
    }
    if (validate.sig.type === 'MULTISIG') {
      Meteor.call('getMultiSigAddressState', req, (err, res) => {
        if (err) {
          Session.set('address', { error: err, id: aId })
        } else {
          console.log(res)
          if (!(res.state.address)) {
            res.state.address = aId
          }
          let bal = new BigNumber(res.state.balance)
          bal = bal.div(SHOR_PER_QUANTA)
          res.state.balance = bal.toString()
          Session.set('address', addressResultsRefactor(res))
        }
      })
    } else {
      Meteor.call('getAddressState', req, (err, res) => {
        if (err) {
          Session.set('address', { error: err, id: aId })
        } else {
          if (res) {
            res.state.balance = (parseInt(res.state.balance, 10) / SHOR_PER_QUANTA).toFixed(9)
            if (!(res.state.address)) {
              res.state.address = aId
            }
            if (parseInt(res.state.txcount, 10) === 0 && parseInt(res.state.nonce, 10) === 0) {
              res.state.empty_warning = true
            } else {
              res.state.empty_warning = false
            }
          }

          req.page_from = 1
          req.page_count = 1
          req.unused_ots_index_from = 0

          Meteor.call('getOTS', req, (error, result) => {
            if (error) {
              console.error('OTS API error:', error)
              Session.set('address', { error, id: aId })
            } else {
              console.log('OTS API result:', result)
              const ots = otsParse(result, qrlAddressValidator.hexString(res.state.address).sig.number)
              console.log('Parsed OTS:', ots)
              res.ots = ots
              res.ots.keysConsumed = res.state.used_ots_key_count

              // generate OTS tracker HTML
              OTS(res.ots.keys)

              Session.set('address', addressResultsRefactor(res))
              Session.set('fetchedTx', false)
              const numPages = Math.ceil(res.state.transaction_hash_count / 10)
              const pages = []
              while (pages.length !== numPages) {
                pages.push({
                  number: pages.length + 1,
                  from: ((pages.length + 1) * 10) + 1,
                  to: ((pages.length + 1) * 10) + 10,
                })
              }
              // let txArray = null
              Session.set('pages', pages)
              Session.set('active', tPage)
              // const startIndex = (tPage - 1) * 10
              // txArray = res.state.transactions.reverse().slice(startIndex, startIndex + 10)
              Session.set('fetchedTx', false)
              loadAddressTransactions(aId, tPage)
            }
          })
        }
      })
    }
  }
  Meteor.call('QRLvalue', (err, res) => {
    if (err) {
      Session.set('qrl', 'Error getting value from API')
    } else {
      Session.set('qrl', res)
    }
  })
}

Template.address.helpers({
  bech32() {
    return Session.equals('addressFormat', 'bech32')
  },
  copySuccess() {
    return Session.get('copySuccess')
  },
  address() {
    try {
      const address = Session.get('address')
      if (Session.get('address').error) {
        return { found: false, parameter: FlowRouter.getParam('aId') }
      }
      if (address !== undefined) {
        if (address.state !== undefined) {
          address.state.address = hexOrB32(
            anyAddressToRaw(address.state.address),
          )
          return address
        }
      }
      return false
    } catch (e) {
      return false
    }
  },
  isCreateNFT() {
    try {
      if (this.token.nft.type === 'CREATE NFT') {
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },
  heldTokenIsNFT() {
    if (this.nft) {
      return true
    }
    return false
  },
  isNFTTransfer() {
    try {
      if (this.transfer_token.nft.type === 'TRANSFER NFT') {
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },
  knownProvider() {
    let id
    if (this.token) {
      id = this.token.nft.id
    } else if (this.transfer_token) {
      id = this.transfer_token.nft.id
    }
    try {
      // const from = Session.get('address').state.address
      let known = false
      _.each(qrlNft.providers, (provider) => {
        if (provider.id === `0x${id}`) {
          known = true
        }
      })
      return known
    } catch (e) {
      return false
    }
  },
  knownProviderNonSpecific() {
    try {
      const from = Session.get('address').state.address
      let known = false
      _.each(qrlNft.providers, (provider) => {
        _.each(provider.addresses, (address) => {
          if (address === from) {
            known = true
          }
        })
      })
      return known
    } catch (e) {
      return false
    }
  },
  providerURL() {
    let id
    if (this.token) {
      id = this.token.nft.id
    } else {
      id = this.transfer_token.nft.id
    }
    let url = ''
    _.each(qrlNft.providers, (provider) => {
      if (provider.id === `0x${id}`) {
        url = provider.url
      }
    })
    return url
  },
  providerName() {
    let id
    if (this.token) {
      id = this.token.nft.id
    } else {
      id = this.transfer_token.nft.id
    }
    let name = ''
    _.each(qrlNft.providers, (provider) => {
      if (provider.id === `0x${id}`) {
        name = provider.name
      }
    })
    return name
  },
  providerID() {
    if (this.token) {
      return `0x${this.token.nft.id}`
    }
    return `0x${this.transfer_token.nft.id}`
  },
  isMultiSig() {
    try {
      if (
        qrlAddressValidator.hexString(
          upperCaseFirst(FlowRouter.getParam('aId')),
        ).sig.type === 'MULTISIG'
      ) {
        return true
      }
      return false
    } catch (error) {
      return false
    }
  },
  pages() {
    let ret = []
    const active = Session.get('active')
    if (Session.get('pages').length > 0) {
      ret = Session.get('pages')
      if (active - 5 <= 0) {
        ret = ret.slice(0, 9)
      } else {
        // eslint-disable-next-line
        if (active + 10 > ret.length) {
          ret = ret.slice(ret.length - 10, ret.length)
        } else {
          ret = ret.slice(active - 5, active + 4)
        }
      }
    }
    return ret
  },
  coinbaseValue() {
    return this.coinbase.amount / SHOR_PER_QUANTA
  },
  // timestampToDateTime(ts) {
  //   console.log('ts', ts)
  //   if (moment.unix(ts.timestamp).isValid()) {
  //     return moment.unix(ts.timestamp).format('HH:mm D MMM YYYY')
  //   }
  //   return 'Unconfirmed Tx'
  // },
  addressTx() {
    let ret = []
    if (Session.get('addressTransactions').length > 0) {
      ret = Session.get('addressTransactions')
    }
    return ret
  },
  addressTransactions() {
    try {
      const transactions = []
      const thisAddress = rawAddressToB32Address(
        Session.get('address').state.address,
      )
      _.each(Session.get('addressTransactions'), (transaction) => {
        // Store modified transaction
        const y = transaction.tx

        // Update timestamp from unix epoch to human readable time/date.
        if (moment.unix(transaction.timestamp).isValid()) {
          y.timestamp = moment
            .unix(transaction.timestamp)
            .format('HH:mm D MMM YYYY')
        } else {
          y.timestamp = 'Unconfirmed Tx'
        }

        y.addr_from = transaction.addr_from

        // Set total received amount if sent to this address
        let thisReceivedAmount = 0
        if (
          transaction.type === 'transfer'
          || transaction.type === 'transfer_token'
        ) {
          _.each(transaction.outputs, (output) => {
            if (output.address_b32 === thisAddress) {
              thisReceivedAmount += parseFloat(output.amount)
            }
          })
        }
        y.thisReceivedAmount = numberToString(thisReceivedAmount)

        transactions.push(y)
      })
      // console.log('transactions', transactions)
      return transactions
    } catch (e) {
      return false
    }
  },
  receivedAmount(tx) {
    if (tx.transfer_token) {
      if (tx.transfer_token.nft) {
        return ''
      }
    }
    try {
      const a = Session.get('address').state.address
      const outputs = tx.transfer
      if (outputs) {
        let amount = 0
        _.each(outputs.addrs_to, (element, key) => {
          if (element === a) {
            amount += outputs.amounts[key] / SHOR_PER_QUANTA
          }
        })
        return amount
      }
      return ''
    } catch (e) {
      return ''
    }
  },
  receivedTokens(tx) {
    if (tx.transfer_token.nft) {
      return ''
    }
    const a = Session.get('address').state.address
    const outputs = tx.transfer_token.addrs_to
    let amount = 0
    if (outputs) {
      _.each(outputs, (element, key) => {
        if (element === a) {
          amount
          += tx.transfer_token.amounts[key]
          / 10 ** parseInt(tx.token.decimals, 10)
        }
      })
      return `${amount} ${tx.token.symbol}`
    }
    return ''
  },
  sendingOutputs(outputs) {
    // console.log('outputs', outputs)
    const result = []
    _.each(outputs.transfer.addrs_to, (element, key) => {
      const a = new BigNumber(outputs.transfer.amounts[key])
      result.push({
        to: element,
        amount: a.dividedBy(SHOR_PER_QUANTA).toString(),
      })
    })
    // console.log('return in sendingOutputs', result)
    return result
  },
  totalTransferred(tx) {
    const outputs = tx.transfer
    if (outputs) {
      let amount = new BigNumber(0)
      _.each(outputs.amounts, (element) => {
        amount = amount.plus(element)
      })
      return amount.dividedBy(SHOR_PER_QUANTA).toString()
    }
    return ''
  },
  addressHasTransactions() {
    try {
      if (Session.get('addressTransactions').length > 0) {
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },
  notFound() {
    try {
      if (Session.get('address').error) {
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },
  isThisAddress(address) {
    try {
      // console.log(address)
      if (address === Session.get('address').state.address) {
        // console.log('isThisAddress ping true on ', address)
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },
  getAmount(index) {
    return this.amounts[index]
  },
  QRtext() {
    return upperCaseFirst(FlowRouter.getParam('aId'))
  },
  qrl() {
    const address = Session.get('address')
    try {
      const value = address.state.balance
      const x = Session.get('qrl')
      return (x * value).toFixed(2)
    } catch (e) {
      return '...'
    }
  },
  color() {
    let ret = ''
    if (this.found) {
      if (this.transaction.tx.transactionType === 'coinbase') {
        ret = 'teal'
      }
      if (this.transaction.tx.transactionType === 'stake') {
        ret = 'red'
      }
      if (this.transaction.tx.transactionType === 'transfer') {
        ret = 'yellow'
      }
    }
    return ret
  },
  isActive() {
    let ret = ''
    const tPage = parseInt(FlowRouter.getParam('tPage'), 10)
    if (this.number === Session.get('active') || tPage === this.number) {
      ret = 'active'
    }
    return ret
  },
  pback() {
    let ret = false
    if (Session.get('active') !== 1) {
      ret = true
    }
    return ret
  },
  pforward() {
    let ret = false
    if (Session.get('active') !== Session.get('pages').length) {
      ret = true
    }
    return ret
  },
  pagination() {
    let ret = false
    if (Session.get('pages')) {
      if (Session.get('pages').length > 1) {
        ret = true
      }
    }
    return ret
  },
  currentPage() {
    return Session.get('active')
  },
  isTransfer(txType) {
    if (txType === 'transfer') {
      return true
    }
    return false
  },
  isTokenCreation(txType) {
    if (txType === 'token') {
      return true
    }
    return false
  },
  isTokenTransfer(txType) {
    if (txType === 'transfer_token') {
      return true
    }
    return false
  },
  isCoinbaseTxn(txType) {
    if (txType === 'coinbase') {
      return true
    }
    return false
  },
  isSlaveTxn(txType) {
    if (txType === 'slave') {
      return true
    }
    return false
  },
  isLatticePKTxn(txType) {
    if (txType === 'latticePK') {
      return true
    }
    return false
  },
  isMessageTxn(txType) {
    if (txType === 'message') {
      return true
    }
    return false
  },
  isMultiSigCreateTxn(txType) {
    if (txType === 'multi_sig_create') {
      return true
    }
    return false
  },
  isMultiSigSpendTxn(txType) {
    if (txType === 'multi_sig_spend') {
      return true
    }
    return false
  },
  isMultiSigVoteTxn(txType) {
    if (txType === 'multi_sig_vote') {
      return true
    }
    return false
  },
  isKeybaseTxn(txType) {
    if (txType === 'keybase') {
      return true
    }
    return false
  },
  isDocumentNotarisation(txType) {
    if (txType === 'document_notarisation') {
      return true
    }
    return false
  },
  tokensHeld() {
    return Session.get('tokensHeld')
  },
  ownTokens() {
    try {
      const tokens = Session.get('tokensHeld')
      let count = tokens.length
      if (count > 0) {
        _.each(tokens, (token) => {
          if (token.nft) {
            count -= 1
          }
        })
      }
      if (count > 0) {
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },
  ownNFTs() {
    try {
      const tokens = Session.get('tokensHeld')
      let count = tokens.length
      if (count > 0) {
        _.each(tokens, (token) => {
          if (!token.nft) {
            count -= 1
          }
        })
      }
      if (count > 0) {
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },
  addressValidation() {
    try {
      if (Session.get('address').state) {
        const thisAddress = rawAddressToHexAddress(
          anyAddressToRaw(Session.get('address').state.address),
        )
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
        const result = {}
        const validationResult = qrlAddressValidator.hexString(thisAddress)

        result.height = validationResult.sig.height
        result.totalSignatures = validationResult.sig.number

        result.signatureScheme = validationResult.sig.type
        result.hashFunction = validationResult.hash.function
        if (Session.get('address').ots) {
          const { keysConsumed } = Session.get('address').ots
          result.keysRemaining = parseInt(result.totalSignatures, 10) - parseInt(keysConsumed, 10)
        }
        return result
      }
      return false
    } catch (e) {
      return false
    }
  },
  totalPages() {
    if (Session.get('pages')) {
      return Session.get('pages').length
    }
    return false
  },
  OTStracker() {
    return Session.get('OTStracker')
  },
  signatories(i) {
    try {
      if (i) {
        if (i === 'MULTISIG') {
          const addressState = Session.get('address').state
          const r = []
          _.each(addressState.signatories, (item, index) => {
            r.push({ address_hex: item, weight: addressState.weights[index] })
          })
          return r
        }
        return `${i.multi_sig_create.weights.length} signatories`
      }
      return null
    } catch (error) {
      return null
    }
  },
  msSpendAmount(i) {
    try {
      let sum = new BigNumber(0)
      _.each(i.multi_sig_spend.amounts, (a) => {
        sum = sum.plus(a)
      })
      return sum.dividedBy(SHOR_PER_QUANTA).toNumber()
    } catch (error) {
      return null
    }
  },
  msVoteStatus(i) {
    try {
      if (i.multi_sig_vote.unvote === true) {
        return 'Approval revoked'
      }
      return 'Approved'
    } catch (error) {
      return null
    }
  },
  threshold() {
    try {
      return Session.get('address').state.threshold
    } catch (error) {
      return null
    }
  },
  hasSlaves() {
    try {
      const x = Session.get('slaves')
      if (x.length === 0) {
        return false
      }
      return true
    } catch (e) {
      return false
    }
  },
  slaves() {
    return Session.get('slaves')
  },
})

// Helper function to toggle JSON display
function toggleJSON() {
  const jsonBox = document.querySelector('.jsonbox')
  const toggleButton = document.querySelector('.jsonclick')

  if (jsonBox) {
    if (jsonBox.style.display === 'none' || !jsonBox.style.display) {
      // Always re-process the data to ensure it's up-to-date with reactive changes
      const myJSON = bufferToHex(Session.get('address'))
      const formatter = new JSONFormatter(myJSON, 1, { theme: 'dark', hoverPreviewEnabled: false })
      jsonBox.innerHTML = ''
      const rendered = formatter.render()

      // Find and extract from the first json-formatter-children element
      const childrenElement = rendered.querySelector('.json-formatter-children')
      if (childrenElement) {
        // Move all children to the root level
        while (childrenElement.firstChild) {
          jsonBox.appendChild(childrenElement.firstChild)
        }
      } else {
        // Fallback to full rendered content
        jsonBox.appendChild(rendered)
      }

      // Open the "state" property after extraction is complete
      setTimeout(() => {
        const stateToggler = jsonBox.querySelector('.json-formatter-toggler-link')
        if (stateToggler) {
          // Check if this is the state property by looking at the key
          const keyElement = stateToggler.querySelector('.json-formatter-key')
          if (keyElement && keyElement.textContent.includes('state')) {
            stateToggler.click()
          }
        }
      }, 0)

      // Remove empty objects from DOM unless expanded
      setTimeout(() => {
        const emptyObjects = jsonBox.querySelectorAll('.json-formatter-children.json-formatter-empty.json-formatter-object')
        const emptyArrays = jsonBox.querySelectorAll('.json-formatter-children.json-formatter-empty.json-formatter-array')

        emptyObjects.forEach((el) => {
          if (!el.closest('.json-formatter-open')) {
            el.remove() // Remove from DOM entirely
          }
        })

        emptyArrays.forEach((el) => {
          if (!el.closest('.json-formatter-open')) {
            el.remove() // Remove from DOM entirely
          }
        })
      }, 0)
      jsonBox.style.display = 'block'
      // Rotate the arrow icon
      if (toggleButton) {
        const arrow = toggleButton.querySelector('svg')
        if (arrow) {
          arrow.style.transform = 'rotate(180deg)'
        }
      }
    } else {
      jsonBox.style.display = 'none'
      // Reset the arrow icon
      if (toggleButton) {
        const arrow = toggleButton.querySelector('svg')
        if (arrow) {
          arrow.style.transform = 'rotate(0deg)'
        }
      }
    }
  }
}

// Helper function to switch to transactions tab
function switchToTransactionsTab() {
  const tabButtons = document.querySelectorAll('.tab-button')
  const tabContents = document.querySelectorAll('.tab-content')

  // Remove active from all
  tabButtons.forEach((btn) => btn.classList.remove('active'))
  tabContents.forEach((content) => content.classList.remove('active'))

  // Activate transactions tab
  const transactionsButton = document.querySelector('[data-tab="transactions"]')
  const transactionsContent = document.querySelector('.tab-content[data-tab="transactions"]')

  if (transactionsButton) transactionsButton.classList.add('active')
  if (transactionsContent) transactionsContent.classList.add('active')
}

Template.address.events({
  'keypress #paginator': (event) => {
    if (event.keyCode === 13) {
      const x = parseInt(document.getElementById('paginator').value, 10)
      const max = Session.get('pages').length
      if ((x < (max + 1)) && (x > 0)) {
        FlowRouter.go(`/a/${upperCaseFirst(FlowRouter.getParam('aId'))}/${x}`)
        window.scrollTo(0, 0)
      }
    }
  },
  'click .refresh': () => {
    Session.set('address', {})
    renderAddressBlock()
  },
  'click .close': () => {
    const messages = document.querySelectorAll('.message')
    messages.forEach((msg) => { msg.style.display = 'none' })
  },
  'click .jsonclick': () => {
    toggleJSON()
  },
  'click .slave-address': () => {
    switchToTransactionsTab()
  },
  'click button[qrl-data]': (event) => {
    let b = 0
    Session.set('addressTransactions', {})
    if (parseInt(event.target.textContent, 10)) {
      b = parseInt(event.target.textContent, 10)
      Session.set('active', b)
    } else {
      const a = event.target.getAttribute('qrl-data')
      b = Session.get('active')
      const c = Session.get('pages').length
      if (a === 'forward') {
        b += 1
      }
      if (a === 'back') {
        b -= 1
      }
      if (b > c) {
        b = c
      }
      if (b < 1) {
        b = 1
      }
    }
    Session.set('active', b)
    Session.set('fetchedTx', false)
    const loading = document.getElementById('loadingTransactions')
    if (loading) loading.style.display = 'block'
    FlowRouter.go(`/a/${FlowRouter.getParam('aId')}/${b}`)
    window.scrollTo(0, 0)
  },
  'click #clickHelp': () => {
    window.open('https://docs.theqrl.org', '_blank')
  },
  'click .transactionRecord': (event) => {
    let route = ''
    const links = event.currentTarget.querySelectorAll('a[href^="/tx/"]')
    if (links.length > 0) {
      route = links[0].getAttribute('href')
      FlowRouter.go(route)
      window.scrollTo(0, 0)
    }
  },
  'click .tab-button': (event) => {
    event.preventDefault()
    const tabId = event.currentTarget.getAttribute('data-tab')

    // Remove active class from all buttons and contents
    const allButtons = document.querySelectorAll('.tab-button')
    const allContents = document.querySelectorAll('.tab-content')

    allButtons.forEach((btn) => { btn.classList.remove('active') })
    allContents.forEach((content) => { content.classList.remove('active') })

    // Add active class to clicked button and corresponding content
    event.currentTarget.classList.add('active')
    const targetContent = document.querySelector(`.tab-content[data-tab="${tabId}"]`)
    if (targetContent) {
      targetContent.classList.add('active')
    }

    // Hide loading spinners when tab is clicked
    if (tabId === 'nftBalances') {
      const nftLoading = document.getElementById('nftBalancesLoading')
      if (nftLoading) nftLoading.style.display = 'none'
    }
    if (tabId === 'tokenBalances') {
      const tokenLoading = document.getElementById('tokenBalancesLoading')
      if (tokenLoading) tokenLoading.style.display = 'none'
    }
  },
  'click .copy-address-btn': async (event) => {
    event.preventDefault()
    Session.set('copySuccess', true)
    // Clear after 3 seconds
    setTimeout(() => {
      Session.set('copySuccess', false)
    }, 3000)
    const address = Session.get('address')
    if (address && address.state && address.state.address) {
      try {
        await navigator.clipboard.writeText(address.state.address)
        console.log('Copy successful')
      } catch (err) {
        console.error('Failed to copy address:', err)
        // Fallback for older browsers
        try {
          const textArea = document.createElement('textarea')
          textArea.value = address.state.address
          document.body.appendChild(textArea)
          textArea.select()
          const success = document.execCommand('copy')
          document.body.removeChild(textArea)

          if (success) {
            console.log('Fallback copy successful')
            // Show success feedback using Session - only after copy succeeds
          } else {
            console.log('Fallback copy failed')
          }
        } catch (fallbackErr) {
          console.error('Fallback copy also failed:', fallbackErr)
        }
      }
    }
  },
  'click [data-action="dismiss-copy-feedback"]': (event) => {
    event.preventDefault()
    Session.set('copySuccess', false)
  },
})

Template.address.onRendered(() => {
  // Initialize copySuccess session variable
  Session.set('copySuccess', false)

  // Initialize Lucide icons for this template
  setTimeout(() => {
    if (window.reinitializeLucideIcons) {
      window.reinitializeLucideIcons()
    }
  }, 200)

  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    Session.set('address', {})
    Session.set('addressTransactions', {})
    Session.set('qrl', 0)
    Session.set('pages', [])
    Session.set('active', 1)
    Session.set('fetchedTx', false)
    Session.set('slaves', [])
    if (FlowRouter.getParam('aId')) {
      renderAddressBlock()
    }
  })

  // Add window resize listener to trigger re-rendering when screen size changes
  const handleResize = () => {
    // Force re-render by updating a reactive variable
    Session.set('screenWidth', window.innerWidth)
    // Also trigger address truncation update
    Session.set('addressTruncationUpdate', Date.now())
  }

  window.addEventListener('resize', handleResize)

  // Clean up listener when template is destroyed
  Template.address.onDestroyed(() => {
    window.removeEventListener('resize', handleResize)
  })

  Tracker.autorun(() => {
    if (Session.equals('addressFormat', 'bech32') || Session.equals('addressFormat', 'hex')) {
      const addressToRender = hexOrB32(Session.get('address').state.address)

      // Re-render identicon
      const identicon = document.getElementById('identicon')
      if (identicon && typeof jdenticon !== 'undefined') {
        jdenticon.update('#identicon', addressToRender)
      }

      // Re-render QR Code
      const qrContainer = document.querySelector('.qr-code-container')
      if (qrContainer) {
        qrContainer.innerHTML = ''
      }
    }
  })

  tokensHeld = []
  Session.set('tokensHeld', [])

  // Get Tokens and Balances
  getTokenBalances(upperCaseFirst(FlowRouter.getParam('aId')), () => {
    const tokenLoading = document.getElementById('tokenBalancesLoading')
    const nftLoading = document.getElementById('nftBalancesLoading')
    if (tokenLoading) tokenLoading.style.display = 'none'
    if (nftLoading) nftLoading.style.display = 'none'
  })

  // Mobile touch tooltip functionality
  const balanceElement = document.querySelector('[data-tooltip]')
  if (balanceElement) {
    let touchTimeout = null

    balanceElement.addEventListener('touchstart', (e) => {
      e.preventDefault()
      clearTimeout(touchTimeout)
      balanceElement.classList.add('opacity-100')
    })

    balanceElement.addEventListener('touchend', (e) => {
      e.preventDefault()
      touchTimeout = setTimeout(() => {
        balanceElement.classList.remove('opacity-100')
      }, 2000) // Hide after 2 seconds
    })

    // Hide tooltip when touching elsewhere
    document.addEventListener('touchstart', (e) => {
      if (!balanceElement.contains(e.target)) {
        balanceElement.classList.remove('opacity-100')
        clearTimeout(touchTimeout)
      }
    })
  }
})
