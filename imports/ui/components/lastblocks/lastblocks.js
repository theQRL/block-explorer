import './lastblocks.html'

const renderLastBlocksBlock = () => {
  Meteor.call('lastblocks', (err, res) => {
    if (err){
      Session.set('lastblocks', { error: err })
      return;
    }

    res.blockheaders = res.blockheaders.reverse()
    for(idx in res.blockheaders)
    {
      tmp = res.blockheaders[idx]
      tmp.header.hash_header_hex = Buffer.from(tmp.header.hash_header).toString('hex')
    }

    Session.set('lastblocks', res)
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
