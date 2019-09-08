/* eslint no-console: 0 */
// const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

import {
  bytesToString, anyAddressToRaw, hexOrB32, numberToString, SHOR_PER_QUANTA, upperCaseFirst
} from '../both/index.js'

global.Buffer = global.Buffer || require('buffer').Buffer // eslint-disable-line

const addHex = (b) => {
  const result = b
  result.header.hash_header_hex = Buffer.from(result.header.hash_header).toString('hex')
  return result
}

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

const address = Buffer.from('Q0105000bb5422d57e569331055dcee3a1bc0334a439d299105d2a149ac75beba95cebd05d2478f'.substring(1), 'hex')
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

/*
message GetTransactionsByAddressReq {
    bytes address = 1;
    uint64 item_per_page = 2;
    uint64 page_number = 3;
}
 */

 const addresstx = anyAddressToRaw('Q0105000bb5422d57e569331055dcee3a1bc0334a439d299105d2a149ac75beba95cebd05d2478f')
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

// req = { filter: 'CURRENT', offset: 0, quantity: 5 }
// Meteor.call('stakers', req, (err, res) => {
//   if (err) {
//     console.log('CURRENT STAKERS: - **ERROR**')
//     console.log(err.message)
//   } else {
//     console.log('CURRENT STAKERS:')
//     console.log(res)
//   }
// })


// req = { filter: 'NEXT', offset: 0, quantity: 5 }
// Meteor.call('stakers', req, (err, res) => {
//   if (err) {
//     console.log('NEXT STAKERS: - **ERROR**')
//     console.log(err.message)
//   } else {
//     console.log('NEXT STAKERS:')
//     console.log(res)
//   }
// })
