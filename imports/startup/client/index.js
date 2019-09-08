// Import client startup through a single index entry point
import './routes.js'
import './grpc-console-tests.js'
import { EXPLORER_VERSION } from '../both/index.js'

global.Buffer = global.Buffer || require('buffer').Buffer // eslint-disable-line

// Developer note console messages
/* eslint-disable no-console */
console.log('block-explorer - ', EXPLORER_VERSION)
console.log('We\'re hiring! Tell us about yourself at jobs@theqrl.org')
console.log('Found a security bug? security@theqrl.org')
console.log('Found a problem? https://github.com/theQRL/block-explorer/issues')
/* eslint-enable no-console */

let disconnectTimer = null

// disconnect after 5 mins in background
const disconnectTime = 5 * 60 * 1000
// for testing:
// const disconnectTime = 5000
const disconnectVoids = [] // eslint-disable-line

export function removeDisconnectTimeout() {
  if (disconnectTimer) {
    clearTimeout(disconnectTimer)
  }
}

function createDisconnectTimeout() {
  removeDisconnectTimeout()
  disconnectTimer = setTimeout(() => {
    Meteor.disconnect()
    console.log('disconnected due to idle state') // eslint-disable-line
    $('.rv-vanilla-modal-overlay-fi').addClass('is-shown')
    $('.rv-vanilla-modal-overlay-fi').show()
    $('.rv-vanilla-modal-fi').addClass('rv-vanilla-modal-is-open')
    $('#target-modal').show()
  }, disconnectTime)
}

export function disconnectIfHidden() {
  removeDisconnectTimeout()
  if (document.hidden) {
    createDisconnectTimeout()
  } else {
    // we *could* automatically reconnect if the tab becomes visible again...
    // Meteor.reconnect()
  }
}

disconnectIfHidden()

document.addEventListener('visibilitychange', disconnectIfHidden)

if (Meteor.isCordova) {
  document.addEventListener('resume', () => { Meteor.reconnect() })
  document.addEventListener('pause', () => { createDisconnectTimeout() })
}
