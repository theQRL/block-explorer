// Import client startup through a single index entry point
import './routes.js'
import { rawAddressToB32Address, rawAddressToHexAddress } from '@theqrl/explorer-helpers'
import { EXPLORER_VERSION } from '../both/index.js'

// Developer note console messages
/* eslint-disable no-console */
console.log('block-explorer - ', EXPLORER_VERSION)
console.log('We\'re hiring! Tell us about yourself at jobs@theqrl.org')
console.log('Found a security bug? security@theqrl.org')
console.log('Found a problem? https://github.com/theQRL/block-explorer/issues')
/* eslint-enable no-console */

// Convert bytes to hex
export function bytesToHex(byteArray) {
  return Array.from(byteArray, (byte) => { // eslint-disable-line
    return ('00' + (byte & 0xFF).toString(16)).slice(-2) // eslint-disable-line
  }).join('')
}

// Returns an address ready to send to gRPC API
export function addressForAPI(address) {
  return Buffer.from(address.substring(1), 'hex')
}

// Convert bytes to string
export function bytesToString(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf))
}

// Represent n number of bytes as human readable size
export function formatBytes(bytes, decimals) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals || 3
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  // eslint-disable-next-line
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

// wrapper to decide which format should addresses be converted to
export function hexOrB32(rawAddress) {
  if (Session.get('addressFormat') === 'bech32') {
    return rawAddressToB32Address(rawAddress)
  }
  return rawAddressToHexAddress(rawAddress)
}


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

