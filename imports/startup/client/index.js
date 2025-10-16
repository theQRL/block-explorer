// Import client startup through a single index entry point
import './routes.js'
import './lucide.js'
// import './grpc-console-tests.js'
import { EXPLORER_VERSION } from '../both/index.js'

global.Buffer = global.Buffer || require('buffer').Buffer // eslint-disable-line

// Developer note console messages
/* eslint-disable no-console */
console.log('block-explorer - ', EXPLORER_VERSION)
console.log('Funding for developers available from The QRL Foundation.  Interested? jobs@theqrl.org')
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

// Add event handlers for disconnect modal
Template.appBody.onRendered(function() {
  // Handle reconnect button
  $('#reconnect-btn').on('click', function() {
    console.log('User clicked reconnect')
    Meteor.reconnect()
    hideDisconnectModal()
  })
  
  // Handle dismiss button
  $('#dismiss-btn').on('click', function() {
    console.log('User dismissed modal')
    hideDisconnectModal()
  })
  
  // Handle close button
  $('#disconnect-modal-close').on('click', function() {
    console.log('User closed modal')
    hideDisconnectModal()
  })
  
  // Handle overlay click to close
  $('#disconnect-modal-overlay').on('click', function(e) {
    if (e.target === this) {
      console.log('User clicked overlay')
      hideDisconnectModal()
    }
  })
})

// Function to hide the disconnect modal
function hideDisconnectModal() {
  $('.rv-vanilla-modal-overlay-fi').removeClass('is-shown')
  $('.rv-vanilla-modal-overlay-fi').hide()
  $('.rv-vanilla-modal-fi').removeClass('rv-vanilla-modal-is-open')
  $('#target-modal').hide()
}

// Export the hide function for use in other parts of the code
window.hideDisconnectModal = hideDisconnectModal

disconnectIfHidden()

document.addEventListener('visibilitychange', disconnectIfHidden)

if (Meteor.isCordova) {
  document.addEventListener('resume', () => { Meteor.reconnect() })
  document.addEventListener('pause', () => { createDisconnectTimeout() })
}