// Import modules used by both client and server through a single index entry point

// Define amount of SHOR contained per QUANTA (10^9)
export const SHOR_PER_QUANTA = 1000000000

// Explorer Version
export const EXPLORER_VERSION = '1.0.3'

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
