/* eslint no-console: 0 */
/* ^^^ remove once testing complete
 */
import JSONFormatter from 'json-formatter-js'
import { Tracker } from 'meteor/tracker'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import qrlAddressValidator from '@theqrl/validate-qrl-address'
import _ from 'underscore'
import qrlNft from '@theqrl/nft-providers'
import { BigNumber } from 'bignumber.js'
import { rawAddressToHexAddress } from '@theqrl/explorer-helpers'
import {
  bufferToHex,
  bytesToString, anyAddressToRaw, hexOrB32, SHOR_PER_QUANTA, upperCaseFirst, decimalToBinary,
} from '../../../startup/both/index.js'
import './address.html'

// Ignore work from invalidated routes, including retries queued before navigation.
function callForAddress(computation, method, args, callback) {
  let cancelled = false
  computation.onInvalidate(() => { cancelled = true })
  const call = (canRetry) => {
    if (cancelled) return
    Meteor.call(method, ...args, (error, result) => {
      if (cancelled) return
      if (canRetry && error && error.error === 'too-many-requests') {
        const delay = Number(error.details && error.details.timeToReset) || 1000
        Meteor.setTimeout(() => call(false), delay + 50)
        return
      }
      callback(error, result)
    })
  }
  call(true)
}

// const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

async function OTS(obj) {
  // console.log('OTS function called with:', obj)

  if (!obj || typeof obj !== 'object') {
    Session.set('OTStracker', { error: 'No OTS data available' })
    return
  }

  const k = Object.keys(obj).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
  // console.log('OTS sorted keys:', k)
  // console.log('OTS total keys:', k.length)

  if (k.length === 0) {
    Session.set('OTStracker', { empty: 'No OTS keys found' })
    return
  }

  // Generate structured data instead of HTML
  const cells = []
  k.forEach((val) => {
    const isUsed = obj[val] === 1
    cells.push({
      key: val,
      isUsed,
      status: isUsed ? 'USED' : 'Available',
    })
  })

  Session.set('OTStracker', { cells })

  // Re-initialize Lucide icons for the new content
  if (window.reinitializeLucideIcons) {
    setTimeout(() => {
      window.reinitializeLucideIcons()
    }, 100)
  }
}

function loadAddressTransactions(aId, page, computation) {
  Session.set('addressTransactions', [])
  Session.set('loadingTransactions', true)
  const addresstx = anyAddressToRaw(aId)

  const setTransactions = (transactions) => {
    Session.set('addressTransactions', transactions)
    const a = Session.get('address')
    if (a && typeof a === 'object') {
      a.transactions = transactions
      Session.set('address', a)
    }
    Session.set('fetchedTx', true)
  }

  const finish = (requestForSlaves) => {
    callForAddress(computation, 'getSlavesByAddress', [requestForSlaves], (errSlaves, resSlaves) => {
      if (!errSlaves) {
        Session.set('slaves', resSlaves)
      }
    })
    Session.set('loadingTransactions', false)
  }

  const fetchPage = (pageNumber, allowFallback) => {
    const request = {
      address: addresstx,
      item_per_page: 10,
      page_number: pageNumber,
    }

    callForAddress(computation, 'getTransactionsByAddress', [request], (err, res) => {
      const txList = (res && Array.isArray(res.transactions_detail)) ? res.transactions_detail : []
      const addressState = Session.get('address')
      const txCount = addressState && addressState.state
        ? parseInt(addressState.state.transaction_hash_count, 10)
        : 0
      const shouldFallbackToZeroIndexedFirstPage = allowFallback
        && page === 1
        && pageNumber === 1
        && txCount > 0
        && (err || txList.length === 0)

      if (shouldFallbackToZeroIndexedFirstPage) {
        fetchPage(0, false)
        return
      }

      if (err) {
        Session.set('addressTransactions', { error: err })
      } else {
        setTransactions(txList)
      }
      finish(request)
    })
  }

  fetchPage(page, true)
}

const getTokenBalances = (aId, cachedTokens, computation, callback) => {
  const request = { address: anyAddressToRaw(aId) }
  callForAddress(computation, 'getFullAddressState', [request], (error, result) => {
    if (error || !result || !result.state) {
      callback(error || new Error('Missing address state'))
      return
    }

    const balances = result.state.address === '' ? {} : (result.state.tokens || {})
    const tokens = cachedTokens.filter(({ hash }) => Object.prototype.hasOwnProperty.call(balances, hash))
    tokens.forEach((token) => {
      token.balance = new BigNumber(balances[token.hash]).shiftedBy(-token.decimals).toFixed()
    })
    const resolvedHashes = new Set(tokens.map(({ hash }) => hash))
    const hashes = Object.keys(balances).filter((hash) => !resolvedHashes.has(hash))
    Session.set('tokensHeld', tokens)
    const unresolved = []
    let nextIndex = 0
    let remaining = hashes.length
    if (remaining === 0) {
      callback(null, unresolved)
      return
    }

    const loadNext = () => {
      if (nextIndex >= hashes.length) return
      const hash = hashes[nextIndex]
      nextIndex += 1
      const requestByHash = { query: Buffer.from(hash, 'hex') }
      callForAddress(computation, 'getObject', [requestByHash], (lookupError, lookupResult) => {
        const transaction = lookupResult && lookupResult.transaction
        const tx = transaction && transaction.tx
        if (lookupError || !tx || tx.transactionType !== 'token' || !tx.token) {
          unresolved.push({ hash, balance: balances[hash] })
        } else {
          const tokenDetails = tx.token
          const thisToken = {}
          thisToken.hash = hash
          thisToken.name = bytesToString(tokenDetails.name)
          thisToken.symbol = bytesToString(tokenDetails.symbol) // eslint-disable-next-line
          thisToken.decimals = Number(tokenDetails.decimals)
          thisToken.balance = new BigNumber(balances[hash]).shiftedBy(-thisToken.decimals).toFixed()

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
            const provider = `Q${Buffer.from(transaction.addr_from).toString('hex')}`
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
            thisToken.nft = {
              provider,
              providerDetails,
              txhash: Buffer.from(tx.transaction_hash).toString('hex'),
              type: 'CREATE NFT',
              id,
              hash: Buffer.from(cryptoHashBytes).toString('hex'),
            }
          }
          tokens.push(thisToken)
          Session.set('tokensHeld', tokens)
        }

        remaining -= 1
        if (remaining === 0) {
          callback(null, unresolved)
        } else {
          loadNext()
        }
      })
    }

    // Keep at most five metadata requests in flight.
    for (let i = 0; i < Math.min(5, hashes.length); i += 1) {
      loadNext()
    }
  })
}

const otsParse = (response, totalSignatures) => {
  // console.log('otsParse called with response:', response)
  // console.log('otsParse totalSignatures:', totalSignatures)

  // Parse OTS Bitfield, and grab the lowest unused key
  const newOtsBitfield = {}
  const firstPage = response.ots_bitfield_by_page && response.ots_bitfield_by_page[0]
  const thisOtsBitfield = (firstPage && firstPage.ots_bitfield) || []

  // console.log('thisOtsBitfield:', thisOtsBitfield)

  thisOtsBitfield.forEach((item, index) => {
    const thisDecimal = new Uint8Array(item)[0]
    const thisBinary = decimalToBinary(thisDecimal).reverse()
    const startIndex = index * 8
    // console.log(`Processing bitfield item ${index}: decimal=${thisDecimal}, binary=${thisBinary}, startIndex=${startIndex}`)

    for (let i = 0; i < 8; i += 1) {
      const thisOtsIndex = startIndex + i
      // Add to parsed array unless we have reached the end of the signatures
      if (thisOtsIndex < totalSignatures) {
        newOtsBitfield[thisOtsIndex] = thisBinary[i]
        // console.log(`  OTS index ${thisOtsIndex}: ${thisBinary[i]}`)
      }
    }
  })

  // console.log('newOtsBitfield before slice:', newOtsBitfield)
  // console.log('newOtsBitfield length:', Object.keys(newOtsBitfield).length)
  // console.log('totalSignatures:', totalSignatures)

  // Don't slice the bitfield - show all available data
  // if (newOtsBitfield.length > totalSignatures) {
  //   newOtsBitfield = newOtsBitfield.slice(0, totalSignatures + 1)
  // }

  // Add in OTS fields to response
  const ots = {}
  ots.keys = newOtsBitfield
  ots.nextKey = response.next_unused_ots_index
  // console.log('otsParse returning:', ots)
  return ots
}

const requestedAddressPage = () => Math.max(1, parseInt(FlowRouter.getParam('tPage'), 10) || 1)

const renderAddressBlock = (aId, page, computation) => {
  Session.set('addressLoading', true)
  const validation = qrlAddressValidator.hexString(aId)
  if (!validation.result) {
    Session.set('address', { error: 'Invalid address', id: aId })
    Session.set('addressLoading', false)
    return
  }

  const request = { address: anyAddressToRaw(aId) }
  const isMultiSig = validation.sig.type === 'MULTISIG'
  const method = isMultiSig ? 'getMultiSigAddressState' : 'getAddressState'
  callForAddress(computation, method, [request], (error, result) => {
    if (error || !result || !result.state) {
      Session.set('address', { error: error || 'Missing address state', id: aId })
      Session.set('addressLoading', false)
      return
    }

    const { state } = result
    const balance = new BigNumber(state.balance).dividedBy(SHOR_PER_QUANTA)
    state.balance = isMultiSig ? balance.toFixed() : balance.toFixed(9)
    state.address = state.address || aId
    if (isMultiSig) {
      Session.set('address', result)
      Session.set('addressLoading', false)
      return
    }

    state.empty_warning = parseInt(state.txcount, 10) === 0 && parseInt(state.nonce, 10) === 0
    const numPages = Math.ceil(state.transaction_hash_count / 10)
    const pages = Array.from({ length: numPages }, (_unused, index) => ({
      number: index + 1,
      from: (index * 10) + 1,
      to: (index + 1) * 10,
    }))
    const activePage = Math.min(page, Math.max(1, pages.length))
    const usedKeys = parseInt(state.used_ots_key_count, 10)
    if (Number.isFinite(usedKeys)) {
      result.keysRemaining = validation.sig.number - usedKeys
    }
    Session.set('address', result)
    Session.set('pages', pages)
    Session.set('active', activePage)
    loadAddressTransactions(aId, activePage, computation)
    Session.set('addressLoading', false)

    const otsRequest = {
      address: request.address, page_from: 1, page_count: 1, unused_ots_index_from: 0,
    }
    callForAddress(computation, 'getOTS', [otsRequest], (otsError, otsResult) => {
      if (otsError) {
        console.error('OTS API error:', otsError)
        Session.set('OTStracker', { error: 'Unable to load OTS data' })
        return
      }
      const ots = otsParse(otsResult, validation.sig.number)
      const address = Session.get('address')
      ots.keysConsumed = state.used_ots_key_count
      address.ots = ots
      Session.set('address', address)
      OTS(ots.keys)
    })
  })
}

Template.address.helpers({
  bech32() {
    return Session.equals('addressFormat', 'bech32')
  },
  copySuccess() {
    return Session.get('copySuccess')
  },
  addressLoading() {
    return Session.get('addressLoading')
  },
  qrlFormatted() {
    try {
      const qrl = Session.get('qrl')
      if (qrl && typeof qrl === 'number') {
        return qrl.toFixed(2)
      }
      return qrl
    } catch (e) {
      return Session.get('qrl')
    }
  },
  balanceUSD() {
    try {
      const qrl = Session.get('qrl')
      const address = Session.get('address')
      const balance = parseFloat(address.state.balance)
      if (!Number.isNaN(balance)) {
        const usdValue = qrl * balance
        return usdValue.toFixed(2)
      }
      return '0.00'
    } catch (e) {
      return '0.00'
    }
  },
  address() {
    try {
      const address = Session.get('address')
      if (Session.get('address').error) {
        return { found: false, parameter: address.id }
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
  isFoundationAddress() {
    try {
      const aId = upperCaseFirst(FlowRouter.getParam('aId'))
      const foundationAddresses = [
        'Q000500997c93dec6039f0fb6008bbf034bc4f9252f6cfd41a7e01c8cf934036deaa4a832c4f240',
        'Q010500e587fd07bb1c5ace98956d9aa6c347e7114ccb4ec7183baa54804cc8b974e91cc3b5617e',
      ]
      return foundationAddresses.includes(aId)
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
    if (this.tx && this.tx.coinbase) {
      return new BigNumber(this.tx.coinbase.amount).dividedBy(SHOR_PER_QUANTA).toFixed()
    }
    return 0
  },
  // timestampToDateTime(ts) {
  //   console.log('ts', ts)
  //   if (moment.unix(ts.timestamp).isValid()) {
  //     return moment.unix(ts.timestamp).format('HH:mm D MMM YYYY')
  //   }
  //   return 'Unconfirmed Tx'
  // },
  addressTx() {
    const tx = Session.get('addressTransactions')
    if (tx && Array.isArray(tx)) {
      return tx
    }
    return []
  },
  loadingTransactions() {
    return Session.get('loadingTransactions')
  },
  addressTransactions() {
    const tx = Session.get('addressTransactions')
    if (tx && Array.isArray(tx)) {
      return tx
    }
    return []
  },
  ts() {
    if (this.header) {
      return moment.unix(this.header.timestamp_seconds).format('HH:mm D MMM YYYY')
    }
    if (this.timestamp) {
      return moment.unix(this.timestamp).format('HH:mm D MMM YYYY')
    }
    return 'Unconfirmed Tx'
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
        let amount = new BigNumber(0)
        _.each(outputs.addrs_to, (element, key) => {
          if (element === a) {
            amount = amount.plus(outputs.amounts[key])
          }
        })
        return amount.dividedBy(SHOR_PER_QUANTA).toFixed()
      }
      return ''
    } catch (e) {
      return ''
    }
  },
  receivedTokens(tx) {
    if (tx.transfer_token && tx.transfer_token.nft) {
      return ''
    }
    const a = Session.get('address').state.address
    const outputs = tx.transfer_token ? tx.transfer_token.addrs_to : null
    let amount = new BigNumber(0)
    if (outputs) {
      _.each(outputs, (element, key) => {
        if (element === a) {
          amount = amount.plus(tx.transfer_token.amounts[key])
        }
      })
      return `${amount.shiftedBy(-Number(tx.token.decimals)).toFixed()} ${tx.token.symbol}`
    }
    return ''
  },
  sendingOutputs(outputs) {
    const result = []
    if (outputs.transfer) {
      _.each(outputs.transfer.addrs_to, (element, key) => {
        const a = new BigNumber(outputs.transfer.amounts[key])
        result.push({
          to: element,
          amount: a.dividedBy(SHOR_PER_QUANTA).toFixed(),
        })
      })
    }
    return result
  },
  totalTransferred(tx) {
    const outputs = tx.transfer
    if (outputs) {
      let amount = new BigNumber(0)
      _.each(outputs.amounts, (element) => {
        amount = amount.plus(element)
      })
      return amount.dividedBy(SHOR_PER_QUANTA).toFixed()
    }
    return ''
  },
  addressHasTransactions() {
    const tx = Session.get('addressTransactions')
    return tx && Array.isArray(tx) && tx.length > 0
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
    if (requestedAddressPage() > 1) {
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
      const { length } = Session.get('pages')
      if (length > 1 || (length === 1 && requestedAddressPage() > 1)) {
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
  tokenBalancesLoading() {
    return Session.equals('tokenBalancesStatus', 'loading')
  },
  tokenBalancesLoaded() {
    return Session.equals('tokenBalancesStatus', 'loaded')
  },
  tokenBalancesIssue() {
    return Session.get('tokenBalancesIssue')
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
        result.keysRemaining = Session.get('address').keysRemaining
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
  otsTrackerData() {
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
      return sum.dividedBy(SHOR_PER_QUANTA).toFixed()
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
  'click .refresh': (event, instance) => {
    instance.addressRefresh.changed()
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
    const button = event.currentTarget
    const direction = button.getAttribute('qrl-data')
    let page = parseInt(direction, 10)
    if (direction === 'forward') page = Session.get('active') + 1
    const lastPage = Session.get('pages').length
    if (direction === 'back') page = Math.min(requestedAddressPage() - 1, lastPage)
    if (page >= 1 && page <= lastPage) {
      FlowRouter.go(`/a/${FlowRouter.getParam('aId')}/${page}`)
    }
  },
  'click #clickHelp': () => {
    window.open('https://docs.theqrl.org', '_blank')
  },
  'click .transactionRecord': (event) => {
    if (event.target.closest('a')) return
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
  },
  'click .retry-token-balances': (event, instance) => {
    instance.tokenBalancesRefresh.changed()
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

Template.address.onCreated(function addressCreated() {
  this.addressRefresh = new Tracker.Dependency()
  this.tokenBalancesRefresh = new Tracker.Dependency()

  this.autorun((computation) => {
    if (!FlowRouter.getParam('aId')) return
    this.addressRefresh.depend()
    Session.set('qrl', 0)
    callForAddress(computation, 'QRLvalue', [], (err, res) => {
      if (err) {
        Session.set('qrl', 'Error getting value from API')
      } else {
        Session.set('qrl', res)
      }
    })
  })

  this.autorun((computation) => {
    const address = FlowRouter.getParam('aId')
    if (!address) return
    const aId = upperCaseFirst(address)
    const page = requestedAddressPage()
    this.addressRefresh.depend()

    Session.set('address', {})
    Session.set('addressTransactions', [])
    Session.set('pages', [])
    Session.set('active', page)
    Session.set('fetchedTx', false)
    Session.set('loadingTransactions', false)
    Session.set('slaves', [])
    Session.set('OTStracker', {})
    renderAddressBlock(aId, page, computation)
  })

  let holdingsAddress
  let hasBalanceSnapshot = false
  let unresolved = []
  this.autorun((computation) => {
    const address = FlowRouter.getParam('aId')
    if (!address) return
    const aId = upperCaseFirst(address)
    if (!qrlAddressValidator.hexString(aId).result) return
    this.tokenBalancesRefresh.depend()
    if (holdingsAddress !== aId) {
      holdingsAddress = aId
      hasBalanceSnapshot = false
      unresolved = []
      Session.set('tokensHeld', [])
    }
    const cachedTokens = Tracker.nonreactive(() => Session.get('tokensHeld'))
    Session.set('tokenBalancesIssue', null)
    Session.set('tokenBalancesStatus', 'loading')

    getTokenBalances(aId, cachedTokens, computation, (error, missingMetadata) => {
      if (!error) {
        hasBalanceSnapshot = true
        unresolved = missingMetadata
      }
      if (error || unresolved.length > 0) {
        let message = 'Some token details could not be loaded.'
        if (error) {
          message = hasBalanceSnapshot
            ? 'Unable to refresh token balances. Previously loaded balances may be out of date.'
            : 'Unable to load token balances.'
        }
        Session.set('tokenBalancesIssue', { message, unresolved })
        Session.set('tokenBalancesStatus', 'failed')
        return
      }
      Session.set('tokenBalancesStatus', 'loaded')
    })
  })
})

Template.address.onRendered(() => {
  Session.set('copySuccess', false)

  setTimeout(() => {
    if (window.reinitializeLucideIcons) {
      window.reinitializeLucideIcons()
    }
  }, 200)

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

// Helpers for OTS Tracker Template
Template.otsTrackerTemplate.helpers({
  otsTrackerData() {
    return Session.get('OTStracker')
  },
})
