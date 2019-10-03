/* eslint no-console: 0 */
// const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

import {
  bytesToString,
  anyAddressToRaw,
  hexOrB32,
  numberToString,
  SHOR_PER_QUANTA,
  upperCaseFirst,
  decimalToBinary,
} from '../both/index.js'

global.Buffer = global.Buffer || require('buffer').Buffer // eslint-disable-line

const addHex = (b) => {
  const result = b
  result.header.hash_header_hex = Buffer.from(result.header.hash_header).toString('hex')
  return result
}

console.log('DOING SOME TESTS...')

Meteor.call('getStats', (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log('getStats', res)
  }
})

let req = '1aa57ca12f6f18fd319fa864822f05e945a9b0f089d3be5983c9c29b6b9f77eb'
Meteor.call('txhash', req, (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log('txhash', res)
  }
})

const address = Buffer.from('Q0105005a4749998aa0eb1b7125e5100bcbc8048b583eb582853db7451d005ed850f2d0fd52cd7c'.substring(1), 'hex')
req = {
  address,
  exclude_ots_bitfield: false,
  exclude_transaction_hashes: false,
}
Meteor.call('getAddressState', req, (err, res) => {
  if (err) {
    console.log('ADDRESS STATE: - **ERROR**')
    console.log(err.message)
  } else {
    console.log('ADDRESS STATE:')
    console.log('getAddressState', res)
  }
})


const addresstx = anyAddressToRaw('Q0105005a4749998aa0eb1b7125e5100bcbc8048b583eb582853db7451d005ed850f2d0fd52cd7c')
req = {
  address: addresstx,
  item_per_page: 10,
  page_number: 1,
}
Meteor.call('getTransactionsByAddress', req, (err, res) => {
  if (err) {
    console.log('ADDRESS STATE: - **ERROR**')
    console.log(err.message)
  } else {
    console.log('TX FOR ADDRESS:')
    console.log('getTransactionsByAddress', res)
  }
})

const otsParse = (response) => {
  // Parse OTS Bitfield, and grab the lowest unused key
  const newOtsBitfield = {}
  let lowestUnusedOtsKey = -1
  // let otsBitfieldLength = 0
  let thisOtsBitfield = []
  // console.log('response.ots_bitfield_by_page.ots_bitfield=', response.ots_bitfield_by_page.ots_bitfield)
  if (response.ots_bitfield_by_page[0].ots_bitfield !== undefined) {
    thisOtsBitfield = response.ots_bitfield_by_page[0].ots_bitfield
  }
  thisOtsBitfield.forEach((item, index) => {
    const thisDecimal = new Uint8Array(item)[0]
    const thisBinary = decimalToBinary(thisDecimal).reverse()
    const startIndex = index * 8

    for (let i = 0; i < 8; i += 1) {
      const thisOtsIndex = startIndex + i

      // Add to parsed array
      newOtsBitfield[thisOtsIndex] = thisBinary[i]

      // Check if this is lowest unused key
      if ((thisBinary[i] === 0) && ((thisOtsIndex < lowestUnusedOtsKey) || (lowestUnusedOtsKey === -1))) {
        lowestUnusedOtsKey = thisOtsIndex
      }

      // Increment otsBitfieldLength
      // otsBitfieldLength += 1
    }
  })

  // Add in OTS fields to response
  const ots = {}
  ots.keys = newOtsBitfield
  ots.nextKey = lowestUnusedOtsKey
  return ots
}

req = {
  address: addresstx,
  page_from: 1,
  page_count: 1,
  unused_ots_index_from: 0,
}
Meteor.call('getOTS', req, (err, res) => {
  if (err) {
    console.log('ADDRESS STATE: - **ERROR**')
    console.log(err.message)
  } else {
    console.log('TX FOR ADDRESS:')
    console.log('getOTS', res)
    console.log(otsParse(res))
  }
})
