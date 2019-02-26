/* eslint no-console: 0, import/no-cycle: 0 */
import { EXPLORER_DEBUG } from './index.js'

if (EXPLORER_DEBUG) {
  // coinbase Tx (transaction_type = 0)
  Meteor.call('tx', 'd53bee9ec7a7d26569cb4b89675ae2055f659bf97fed1a2a7e1fd29110c97ed3', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  // transfer Tx (transaction_type = 1)
  Meteor.call('tx', '46b0bc75307c15f08fcdb5c74e87b0cb44c1c8286d3d9ac6faa268de4a5ca3dd', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  // create token Tx (transaction_type = 2)
  Meteor.call('tx', 'bc64bd33a69ead60a8123d01a9b5b923067b8f2c388e9102109fdbd6e2f9a1cd', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  // transfer token Tx (transaction_type = 3)
  Meteor.call('tx', '789e0b7f9bfc7c3388de3a7f6f4c28036f7aab15f323c758d10eeafdc6448374', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  // message Tx (transaction_type = 4)
  Meteor.call('tx', 'fab40ade8af5355d15e01bb80ed42fecf37107932dd7ab484e9f9a187a651796', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  // slave Tx (transaction_type = 5)
  Meteor.call('tx', '22a3e6b27285fe1ada2195fb76542ebbb12d52b63a95a8ddaf43bc9cee66154e', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  Meteor.call('address', 'Q0106001d34628da087339ddd650a843e131fa4a3f3b107e9b6222d609f6dad3860b4798cc5b361', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  Meteor.call('block', 200, (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  Meteor.call('transfer', '46b0bc75307c15f08fcdb5c74e87b0cb44c1c8286d3d9ac6faa268de4a5ca3dd', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  Meteor.call('coinbase', 'd53bee9ec7a7d26569cb4b89675ae2055f659bf97fed1a2a7e1fd29110c97ed3', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  // create token Tx (transaction_type = 2)
  Meteor.call('createToken', 'bc64bd33a69ead60a8123d01a9b5b923067b8f2c388e9102109fdbd6e2f9a1cd', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  // transfer token Tx (transaction_type = 3)
  Meteor.call('transferToken', '789e0b7f9bfc7c3388de3a7f6f4c28036f7aab15f323c758d10eeafdc6448374', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  // message Tx [NOTARISE] (transaction_type = 4)
  Meteor.call('messageTx', 'fab40ade8af5355d15e01bb80ed42fecf37107932dd7ab484e9f9a187a651796', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  // message Tx [KEYBASE] (transaction_type = 4)
  Meteor.call('messageTx', 'c992f2617e98fe974a37fbe33c7abc41742aeef424ce969194c4382cbb4d8bb9', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })

  // message Tx [MESSAGE] (transaction_type = 4)
  Meteor.call('messageTx', '6dd93529bab3eb8bef9b849aa0bbc0b050ed1f4d0a825f73bf3c5c9c479703a9', (error, result) => {
    if (!error) {
      console.log(result)
    } else {
      // error handling
      console.log(error)
    }
  })
}
