import './mobile.html'
import { EXPLORER_VERSION } from '../../startup/both/index.js'

Template.mobile.onCreated(() => {
//
})
Template.mobile.events({
//
})
Template.mobile.helpers({
  qrlExplorerVersion() {
    return EXPLORER_VERSION
  },
})
