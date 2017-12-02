import './lastblocks.html'

const addHex = (b) => {
  const result = b
  result.header.hash_header_hex = Buffer.from(result.header.hash_header).toString('hex')
  return result
}

const renderLastBlocksBlock = () => {
  Meteor.call('lastblocks', (err, res) => {
    if (err) {
      Session.set('lastblocks', { error: err })
    } else {
      res.blockheaders = res.blockheaders.reverse()
      const editedBlockheaders = []
      res.blockheaders.forEach((bh) => {
        editedBlockheaders.push(addHex(bh))
      })
      res.blockheaders = editedBlockheaders
      Session.set('lastblocks', res)
    }
  })
}

Template.lastblocks.onCreated(() => {
  Session.set('lastblocks', {})
  renderLastBlocksBlock()
})

Template.lastblocks.helpers({
  lastblocks() {
    return Session.get('lastblocks')
  },
  ts() {
    const x = moment.unix(this.header.timestamp.seconds)
    return moment(x).format('HH:mm D MMM YYYY')
  },
  interval() {
    const x = Math.round(this.block_interval)
    return `${x} seconds`
  },
  votes_percent() {
    if (this.header.block_number === 0) {
      return 'N/A'
    }

    let vp = this.voted_weight / this.total_stake_weight
    vp *= 100
    return `${vp.toFixed(2)}%`
  },
  reward(rew) {
    let r = 'Undetermined'
    try {
      const x = parseFloat(rew) / 100000000
      r = x
    } catch (e) {
      r = 'Error parsing API results'
    }
    return r
  },
})

Template.lastblocks.events({
  'click .refresh': () => {
    Session.set('lastblocks', {})
    renderLastBlocksBlock()
  },
  'click .close': () => {
    $('.message').hide()
  },
})
