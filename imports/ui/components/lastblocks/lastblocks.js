import './lastblocks.html'

const addHex = (b) => {
  const result = b
  result.header.hash_header_hex = Buffer.from(result.header.hash_header).toString('hex')
  return result
}

const sumValues = obj => Object.values(obj).reduce((a, b) => a + b)

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
  tsReadable() {
    const x = moment.unix(this.header.timestamp.seconds)
    return moment(x).fromNow()
  },
  interval() {
    const x = Math.round(this.block_interval)
    return `${x} seconds`
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
  numberTransactions() {
    const x = this.transaction_count.count
    //     UNKNOWN = 0;
    //     TRANSFER = 1;
    //     STAKE = 2;
    //     DESTAKE = 3;
    //     COINBASE = 4;
    //     LATTICE = 5;
    //     DUPLICATE = 6;
    //     VOTE = 7;
    return sumValues(x)
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
  'click .item': (event) => {
    const blockTarget = $(event.target).parentsUntil('.items').closest('.item[data-block]').attr('data-block')
    FlowRouter.go(`/block/${blockTarget}`)
  },
})
