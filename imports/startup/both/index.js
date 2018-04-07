// Import modules used by both client and server through a single index entry point

// Define amount of SHOR contained per QUANTA (10^9)
export const SHOR_PER_QUANTA = 1000000000

// Explorer Version
export const EXPLORER_VERSION = '0.3.1'

// Function to cleanly represent large decimal numbers without exponentional formatting.
export function numberToString(num) {
  const math = require('mathjs')
  return math.format(num, { exponential: { lower: 0, upper: Infinity } })
}

// Convert decimal value to binary
export function decimalToBinary(decimalNumber) {
  const binaryArray = []
  while (decimalNumber >= 1) {
    binaryArray.unshift(decimalNumber % 2)
    decimalNumber = Math.floor(decimalNumber / 2)
  }
  // Pad start of array with 0s if not a full byte
  while (binaryArray.length < 8) {
    binaryArray.unshift(0)
  }
  return binaryArray
}
