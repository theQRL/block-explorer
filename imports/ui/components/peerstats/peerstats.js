import { peerstats } from '/imports/api/index.js'
import './peerstats.html'

Template.peerstats.onCreated(() => {
  Meteor.subscribe('peerstats')
})

Template.peerstats.helpers({
  peerstats() {
    const res = peerstats.findOne()
    return res
  },
  ts() {
    const x = moment.unix(this.node_chain_state.timestamp)
    return moment(x).format('HH:mm D MMM YYYY')
  },
  zeroCheck() {
    let ret = false
    const x = peerstats.findOne()
    if (x) { if (x.length === 0) { ret = true } }
    if (x === undefined) { ret = true }
    return ret
  },
})