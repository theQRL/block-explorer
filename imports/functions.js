import Long from 'long'
import mathjs from 'mathjs'

export const toHexString = byteArray => Buffer.from(byteArray).toString('hex')

export const toTextString = byteArray => Buffer.from(byteArray).toString()

export const fromHexString = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))

export const hexToString = (input) => {
  const hex = input.toString()
  let str = ''
  for (let n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16))
  }
  return str
}

export const toLongString = (lowBits, highBits) => {
  const longVal = new Long(lowBits, highBits)
  return longVal.toString()
}

export const toLongStringFromUInt32 = (int) => {
  const longVal = toLongString(int, 0)
  return longVal
}

// Define amount of SHOR contained per QUANTA (10^9)
export const SHOR_PER_QUANTA = 1000000000

export function numberToString(num) {
  return mathjs.format(num, { notation: 'fixed', lowerExp: 1e-100, upperExp: Infinity })
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
