// Import modules used by both client and server through a single index entry point
import { rawAddressToB32Address, rawAddressToHexAddress, b32AddressToRawAddress } from '@theqrl/explorer-helpers'

// Define amount of SHOR contained per QUANTA (10^9)
export const SHOR_PER_QUANTA = 1000000000

// Explorer Version
export const EXPLORER_VERSION = '1.0.6'

// Function to cleanly represent large decimal numbers without exponential formatting.
export function numberToString(num) {
  // should move to import here
  const math = require('mathjs') // eslint-disable-line
  return math.format(num, { notation: 'fixed', lowerExp: 1e-100, upperExp: Infinity })
}

// Convert decimal value to binary
export function decimalToBinary(decimalNumber) {
  const binaryArray = []
  while (decimalNumber >= 1) {
    binaryArray.unshift(decimalNumber % 2)
    decimalNumber = Math.floor(decimalNumber / 2) // eslint-disable-line
  }
  // Pad start of array with 0s if not a full byte
  while (binaryArray.length < 8) {
    binaryArray.unshift(0)
  }
  return binaryArray
}

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

export function anyAddressToRaw(address) {
  if (address[0] === 'q') {
    const answer = b32AddressToRawAddress(address)
    return answer
  }
  return addressForAPI(address)
}