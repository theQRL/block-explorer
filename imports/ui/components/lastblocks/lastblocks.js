import { Blocks } from '/imports/api/index.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import './lastblocks.html'
import { rawAddressToHexAddress } from '@theqrl/explorer-helpers'
import { SHOR_PER_QUANTA, hexOrB32 } from '../../../startup/both/index.js'
import { MINING_POOLS } from '../../../startup/client/mining-pools.js'

const addHex = (b) => {
  const result = b
  result.header.hash_header_hex = Buffer.from(result.header.hash_header).toString('hex')
  return result
}

const sumValues = (obj) => Object.values(obj).reduce((a, b) => a + b)

const findMiningPool = (minedBy) => {
  if (!minedBy) {
    return null
  }

  try {
    const minerHexAddress = rawAddressToHexAddress(minedBy)
    return MINING_POOLS.find((pool) => pool.address === minerHexAddress) || null
  } catch (e) {
    return null
  }
}

Template.lastblocks.onCreated(() => {
  Meteor.subscribe('blocks')
})

Template.lastblocks.helpers({
  isHome() {
    return FlowRouter.getRouteName() === 'App.home'
  },
  isLastBlocks() {
    return FlowRouter.getRouteName() === 'Lastblocks.home'
  },
  lastblocks() {
    const res = Blocks.findOne({ _id: 'blocks_singleton' })
    return res
  },
  pagedBlockheaders() {
    const res = Blocks.findOne({ _id: 'blocks_singleton' })
    if (res && res.blockheaders) {
      let { blockheaders } = res

      // Filter out invalid entries
      blockheaders = blockheaders.filter((bh) => bh && bh.header)

      if (FlowRouter.getRouteName() === 'App.home') {
        return blockheaders.slice(0, 10).map((bh) => addHex(bh))
      }

      // Pagination for /lastblocks using query params
      const itemsPerPage = 10
      const activePage = parseInt(FlowRouter.getQueryParam('page'), 10) || 1
      const startIndex = (activePage - 1) * itemsPerPage
      return blockheaders.slice(startIndex, startIndex + itemsPerPage).map((bh) => addHex(bh))
    }
    return []
  },
  // Pagination helpers using query params
  currentPage() {
    return parseInt(FlowRouter.getQueryParam('page'), 10) || 1
  },
  totalPages() {
    const res = Blocks.findOne({ _id: 'blocks_singleton' })
    if (res && res.blockheaders) {
      const filteredHeaders = res.blockheaders.filter((bh) => bh && bh.header)
      return Math.ceil(filteredHeaders.length / 10) || 1
    }
    return 1
  },
  pages() {
    const res = Blocks.findOne({ _id: 'blocks_singleton' })
    if (res && res.blockheaders) {
      const filteredHeaders = res.blockheaders.filter((bh) => bh && bh.header)
      const totalPages = Math.ceil(filteredHeaders.length / 10)
      const pages = []
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push({
          number: i,
          isActive: (parseInt(FlowRouter.getQueryParam('page'), 10) || 1) === i,
        })
      }

      const currentPage = parseInt(FlowRouter.getQueryParam('page'), 10) || 1
      if (pages.length <= 10) {
        return pages
      }
      if (currentPage <= 5) {
        return pages.slice(0, 9)
      }
      if (currentPage > pages.length - 5) {
        return pages.slice(pages.length - 9)
      }
      return pages.slice(currentPage - 5, currentPage + 4)
    }
    return []
  },
  pback() {
    const currentPage = parseInt(FlowRouter.getQueryParam('page'), 10) || 1
    return currentPage > 1
  },
  pforward() {
    const res = Blocks.findOne({ _id: 'blocks_singleton' })
    if (res && res.blockheaders) {
      const filteredHeaders = res.blockheaders.filter((bh) => bh && bh.header)
      const totalPages = Math.ceil(filteredHeaders.length / 10)
      const currentPage = parseInt(FlowRouter.getQueryParam('page'), 10) || 1
      return currentPage < totalPages
    }
    return false
  },
  ts() {
    if (!this.header) return ''
    const x = moment.unix(this.header.timestamp_seconds)
    return moment(x).format('HH:mm:ss D MMM YYYY')
  },
  tsReadable() {
    if (!this.header) return ''
    const x = moment.unix(this.header.timestamp_seconds)
    return moment(x).fromNow()
  },
  isKnownPool() {
    return !!findMiningPool(this.minedBy)
  },
  poolName() {
    const pool = findMiningPool(this.minedBy)
    return pool ? pool.name : ''
  },
  poolLink() {
    const pool = findMiningPool(this.minedBy)
    return pool ? pool.link : ''
  },
  minerAddress() {
    if (!this.minedBy) return 'Unknown'
    try {
      return hexOrB32(this.minedBy)
    } catch (e) {
      return 'Unknown'
    }
  },
  minerTip() {
    return this.minedBy
  },
  interval() {
    // Get the current block data
    const res = Blocks.findOne({ _id: 'blocks_singleton' })
    if (!res || !res.blockheaders) {
      return 'N/A'
    }

    // Find the current block in the list
    const currentBlockIndex = res.blockheaders.findIndex((block) => (
      block.header.block_number === this.header.block_number
    ))

    // Note: in descending list, previous block (lower number) is at HIGHER index
    if (currentBlockIndex === -1 || currentBlockIndex === res.blockheaders.length - 1) {
      return 'N/A'
    }

    const previousBlock = res.blockheaders[currentBlockIndex + 1]

    if (!previousBlock) {
      return 'N/A'
    }

    // Calculate the time difference
    const currentTime = parseInt(this.header.timestamp_seconds, 10)
    const previousTime = parseInt(previousBlock.header.timestamp_seconds, 10)
    const intervalSeconds = currentTime - previousTime

    if (intervalSeconds < 0) {
      return 'N/A'
    }

    return `${Math.round(intervalSeconds)}s`
  },
  transacted(rew) {
    let r = 'Undetermined'
    try {
      const x = (parseInt(rew, 10) / SHOR_PER_QUANTA).toFixed(9)
      r = x
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
  numberTransactions() {
    if (!this.transaction_count || !this.transaction_count.count) return 0
    const x = this.transaction_count.count
    return sumValues(x)
  },
})

Template.lastblocks.events({
  'click .close': () => {
    $('.message').hide()
  },
  'click .lastBlocks': (event) => {
    const route = event.currentTarget.getAttribute('data-dest')
    FlowRouter.go(`/block/${route}`)
    window.scrollTo(0, 0)
  },
  'click .page-btn': (event) => {
    const newPage = parseInt(event.target.getAttribute('qrl-page'), 10)
    if (newPage) {
      FlowRouter.setQueryParams({ page: newPage })
      window.scrollTo(0, 0)
    }
  },
  'click button[qrl-data]': (event) => {
    const action = event.target.getAttribute('qrl-data')
    const currentPage = parseInt(FlowRouter.getQueryParam('page'), 10) || 1
    const res = Blocks.findOne({ _id: 'blocks_singleton' })
    if (res && res.blockheaders) {
      const filteredHeaders = res.blockheaders.filter((bh) => bh && bh.header)
      const totalPages = Math.ceil(filteredHeaders.length / 10) || 1
      let newPage = currentPage
      if (action === 'forward') {
        newPage += 1
      } else if (action === 'back') {
        newPage -= 1
      }
      if (newPage <= totalPages && newPage > 0) {
        FlowRouter.setQueryParams({ page: newPage })
        window.scrollTo(0, 0)
      }
    }
  },
  'keyup #paginator': (event) => {
    if (event.which === 13) {
      let page = parseInt(event.target.value, 10)
      const res = Blocks.findOne({ _id: 'blocks_singleton' })
      if (res && res.blockheaders) {
        const filteredHeaders = res.blockheaders.filter((bh) => bh && bh.header)
        const totalPages = Math.ceil(filteredHeaders.length / 10) || 1
        if (page < 1) page = 1
        if (page > totalPages) page = totalPages
        FlowRouter.setQueryParams({ page })
        event.target.value = ''
        window.scrollTo(0, 0)
      }
    }
  },
})
