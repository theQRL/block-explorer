import Long from 'long'

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
