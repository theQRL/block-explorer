/* eslint no-console: 0 */
// const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

const addHex = (b) => {
  const result = b
  result.header.hash_header_hex = Buffer.from(result.header.hash_header).toString('hex')
  return result
}

Meteor.call('getStats', (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})

let req = {
  query: Buffer.from(('63e4fc9803fb0c44d98dbff04f54ca2592e4faa9964bac2ed4f5715fc753c54a').toString()),
}
Meteor.call('getObject', req, (err, res) => {
  if (err) {
    console.log(err.message)
  } else {
    console.log(res)
  }
})

req = {
  query: Buffer.from(('150').toString()),
}
Meteor.call('getObject', req, (err, res) => {
  if (err) {
    console.log('GET BLOCK 0: - **ERROR**')
    console.log(err.message)
  } else {
    console.log('GET BLOCK 0:')
    console.log(res)
  }
})


req = { filter: 'BLOCKHEADERS', offset: 0, quantity: 5 }
Meteor.call('getLatestData', req, (err, res) => {
  if (err) {
    console.log('LATEST BLOCKHEADERS: - **ERROR**')
    console.log(err.message)
  } else {
    console.log('LATEST BLOCKHEADERS:')
    res.blockheaders = res.blockheaders.reverse()
    const editedBlockheaders = []
    res.blockheaders.forEach((bh) => {
      editedBlockheaders.push(addHex(bh))
    })
    res.blockheaders = editedBlockheaders
    console.log(res)
  }
})


req = { filter: 'TRANSACTIONS_UNCONFIRMED', offset: 0, quantity: 5 }
Meteor.call('getLatestData', req, (err, res) => {
  if (err) {
    console.log('LATEST TRANSACTIONS_UNCONFIRMED: - **ERROR**')
    console.log(err.message)
  } else {
    console.log('LATEST TRANSACTIONS_UNCONFIRMED:')
    console.log(res)
  }
})

req = { filter: 'TRANSACTIONS', offset: 0, quantity: 5 }
Meteor.call('getLatestData', req, (err, res) => {
  if (err) {
    console.log('LATEST TRANSACTIONS: - **ERROR**')
    console.log(err.message)
  } else {
    console.log('LATEST TRANSACTIONS:')
    console.log(res)
  }
})

const address = Buffer.from('Q010600647bdcb1548622afa0a92ec1ba7b5d0fc212a3f2ae69fd830ac6ce01de5d94f1a66a7699'.substring(1), 'hex')
req = {
  address,
}
Meteor.call('getAddressState', req, (err, res) => {
  if (err) {
    console.log('ADDRESS STATE: - **ERROR**')
    console.log(err.message)
  } else {
    console.log('ADDRESS STATE:')
    console.log(res)
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
