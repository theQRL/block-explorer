import { BigNumber } from 'bignumber.js'
import _ from 'underscore'
import qrlNft from '@theqrl/nft-providers'
import { lasttx } from '/imports/api/index.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './lasttx.html'
import { SHOR_PER_QUANTA } from '../../../startup/both/index.js'

const getLastTxBorderTypeClass = (txType) => {
  if (txType === 'transfer') {
    return 'border-type-transfer'
  }
  if (txType === 'coinbase') {
    return 'border-type-coinbase'
  }
  if (txType === 'transfer_token') {
    return 'border-type-token'
  }
  if (txType === 'message') {
    return 'border-type-message'
  }
  if (txType === 'slave') {
    return 'border-type-slave'
  }
  if (txType === 'latticePK') {
    return 'border-type-lattice'
  }
  return 'border-type-multisig'
}

Template.lasttx.onCreated(() => {
  Meteor.subscribe('lasttx')
})

Template.lasttx.helpers({
  multipleDestinations() {
    if (this.explorer.outputs) {
      if (this.explorer.outputs.length > 1) {
        return true
      }
    }
    return false
  },
  lasttx() {
    const res = lasttx.findOne()
    return res
  },
  fromAddress() {
    return this.explorer.from_hex
  },
  toAddress() {
    if (this.explorer.outputs) {
      if (this.explorer.outputs.length > 1) {
        return `${this.explorer.outputs.length} destinations`
      }
      return this.explorer.outputs[0].address_hex
    }
    return ''
  },
  amount() {
    if (this.tx.transfer) {
      return this.explorer.totalTransferred
    }
    if (this.tx.transfer_token) {
      return this.explorer.totalTransferred
    }
    return ''
  },
  block() {
    if (this.header) {
      // this will be undefined for unconfirmed transactions
      return this.header.block_number
    }
    return ''
  },
  ts() {
    if (this.header) {
      const x = moment.unix(this.header.timestamp_seconds)
      return moment(x).format('HH:mm D MMM YYYY')
    }
    const x = moment.unix(this.timestamp_seconds)
    return moment(x).format('HH:mm D MMM YYYY')
  },
  zeroCheck() {
    let ret = false
    const x = lasttx.findOne()
    if (x) {
      if (x.length === 0) {
        ret = true
      }
    }
    if (x === undefined) {
      ret = true
    }
    return ret
  },
  borderTypeClass(txType) {
    return getLastTxBorderTypeClass(txType)
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
  isNFT() {
    if (this.nft || this.explorer.nft) {
      return true
    }
    return false
  },
  isTransferNFT() {
    if (this.explorer.type === 'TRANSFER NFT') {
      return true
    }
    return false
  },
  providerID() {
    return `0x${this.explorer.nft.id}`
  },
  knownProvider() {
    const { id } = this.explorer.nft
    const from = this.explorer.from_hex
    let known = false
    _.each(qrlNft.providers, (provider) => {
      if (provider.id === `0x${id}`) {
        _.each(provider.addresses, (address) => {
          if (address === from) {
            known = true
          }
        })
      }
    })
    return known
  },
  providerURL() {
    const { id } = this.explorer.nft
    let url = ''
    _.each(qrlNft.providers, (provider) => {
      if (provider.id === `0x${id}`) {
        url = provider.url
      }
    })
    return url
  },
  providerName() {
    const { id } = this.explorer.nft
    let name = ''
    _.each(qrlNft.providers, (provider) => {
      if (provider.id === `0x${id}`) {
        name = provider.name
      }
    })
    return name
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
    if (txType === 'MESSAGE') {
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
  isStake(txType) {
    if (txType === 'stake') {
      return true
    }
    return false
  },
  isCoinbase(txType) {
    if (txType === 'coinbase') {
      return true
    }
    return false
  },
  isSlave(txType) {
    if (txType === 'slave') {
      return true
    }
    return false
  },
  isLatticePK(txType) {
    if (txType === 'latticePK') {
      return true
    }
    return false
  },
  isMessage(txType) {
    if (txType === 'message') {
      return true
    }
    return false
  },

  isDocumentNotarisation(txType) {
    if (txType === 'DOCUMENT_NOTARISATION') {
      return true
    }
    return false
  },

  isKeybaseTxn(txType) {
    if (txType === 'KEYBASE') {
      return true
    }
    return false
  },
  isConfirmed(confirmed) {
    if (confirmed === 'true') {
      return true
    }
    return false
  },
  msVoteStatus(i) {
    try {
      if (i.tx.multi_sig_vote.unvote === true) {
        return 'Approval revoked'
      }
      return 'Approved'
    } catch (error) {
      return null
    }
  },
  msSpendAmount(i) {
    try {
      let sum = new BigNumber(0)
      _.each(i.tx.multi_sig_spend.amounts, (a) => {
        sum = sum.plus(a)
      })
      return sum.dividedBy(SHOR_PER_QUANTA).toNumber()
    } catch (error) {
      return null
    }
  },
})

Template.lasttx.events({
  'click .transactionRecord': (event) => {
    // Find the transaction hash in the clicked element
    const hashElement = event.currentTarget.querySelector('[data-full-text]')
    if (hashElement) {
      const transactionHash = hashElement.getAttribute('data-full-text')
      FlowRouter.go(`/tx/${transactionHash}`)
      window.scrollTo(0, 0)
    }
  },
})
