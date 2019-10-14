import JSONFormatter from 'json-formatter-js'
import qrlAddressValdidator from '@theqrl/validate-qrl-address'
import {
  SHOR_PER_QUANTA,
  numberToString,
  decimalToBinary,
} from '../../functions.js'

const renderAddress = () => {
  const aId = FlowRouter.getParam('aId')
  if (aId) {
    Meteor.call('address', aId, (err, res) => {
      if (err) {
        Session.set('address', {
          error: err,
          id: aId,
          found: false,
        })
        return false
      }
      Session.set('address', res)
      const formatter = new JSONFormatter(res)
      $('#addressjson').html(formatter.render())
      $('.data').removeClass('loaded')
      Session.set('loading', false)
      return true
    })
    //   Meteor.call('QRLvalue', (err, res) => {
    //     if (err) {
    //       Session.set('qrl', 'Error getting value from API')
    //     } else {
    //       Session.set('qrl', res)
    //     }
    //   })
    //   Meteor.call('status', (err, res) => {
    //     if (err) {
    //       Session.set('status', { error: err })
    //     } else {
    //       Session.set('status', res)
    //     }
    //   })
  }
}

Template.address.helpers({
  id() {
    return FlowRouter.getParam('aId')
  },
  balance() {
    if (!(Session.get('loading'))) {
      try {
        if (Session.get('address').found === false) {
          return 0
        }
        const bal = Session.get('address').balance
        return numberToString(bal / SHOR_PER_QUANTA)
      } catch (e) {
        return false
      }
    }
    return false
  },
  loading() {
    try {
      const status = Session.get('loading')
      return status
    } catch (e) {
      return false
    }
  },
  validAddress() {
    const validationResult = qrlAddressValdidator.hexString(FlowRouter.getParam('aId'))
    const result = {}
    result.height = validationResult.sig.height
    result.totalSignatures = validationResult.sig.number
    if (validationResult.result === true) {
      // Parse OTS Bitfield, and grab the lowest unused key
      const newOtsBitfield = {}
      let lowestUnusedOtsKey = -1
      let otsBitfieldLength = 0
      let thisOtsBitfield = false
      try { thisOtsBitfield = Session.get('address').ots_bit_field } catch (e) { return false }
      if (thisOtsBitfield !== undefined) {
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
            otsBitfieldLength += 1
          }
        })

        // If all keys in bitfield are used, lowest key will be what is shown in ots_counter + 1
        if (lowestUnusedOtsKey === -1) {
          if (Session.get('address').ots_counter === '0') {
            lowestUnusedOtsKey = otsBitfieldLength
          } else {
            lowestUnusedOtsKey = parseInt(Session.get('address').ots_counter, 10) + 1
          }
        }

        // Calculate number of keys that are consumed
        let totalKeysConsumed = 0
        // First add all tracked keys from bitfield
        for (let i = 0; i < otsBitfieldLength; i += 1) {
          if (newOtsBitfield[i] === 1) {
            totalKeysConsumed += 1
          }
        }

        // Then add any extra from `otsBitfieldLength` to `ots_counter`
        if (Session.get('address').ots_counter !== 0) {
          totalKeysConsumed += parseInt(Session.get('address').ots_counter, 10) - (otsBitfieldLength - 1)
        }

        // Add in OTS fields to response
        // response.ots = {}
        // response.ots.keys = newOtsBitfield
        // response.ots.nextKey = lowestUnusedOtsKey
        // response.ots.keysConsumed = totalKeysConsumed

        // console.log(newOtsBitfield)
        // console.log(totalKeysConsumed)
        // console.log(lowestUnusedOtsKey)

        result.keysRemaining = result.totalSignatures - totalKeysConsumed
      }
    }
    result.signatureScheme = validationResult.sig.type
    result.hashFunction = validationResult.hash.function
    result.valid = validationResult.result
    result.validator = validationResult
    if (result.validator.sig.result === true) {
      result.validator.sig.class = 'fa-check text-success'
    } else {
      result.validator.sig.class = 'fa-times text-danger'
    }
    if (result.validator.len.result === true) {
      result.validator.len.class = 'fa-check text-success'
    } else {
      result.validator.len.class = 'fa-times text-danger'
    }
    if (result.validator.hash.result === true) {
      result.validator.hash.class = 'fa-check text-success'
    } else {
      result.validator.hash.class = 'fa-times text-danger'
    }
    if (result.validator.checksum.result === true) {
      result.validator.checksum.class = 'fa-check text-success'
    } else {
      result.validator.checksum.class = 'fa-times text-danger'
    }
    return result
  },
  addressTx() {
    if (!(Session.get('loading'))) {
      try {
        const tx = Session.get('address').transactions
        return tx
      } catch (e) {
        return false
      }
    }
    return false
  },
  rowColour() {
    if (!(Session.get('loading'))) {
      if (this.type === 'COINBASE') {
        return 'table-info'
      }
      if (this.type === 'TRANSFER_IN' || this.type === 'TRANSFER_OUT') {
        return 'table-warning'
      }
      if (this.type === 'TOKEN_CREATE' || this.type === 'TOKEN_TRANSFER') {
        return 'table-danger'
      }
      if (this.type === 'DOCUMENT_NOTARISATION' || this.type === 'KEYBASE' || this.type === 'MESSAGE') {
        return 'table-success'
      }
      return ''
    }
    return false
  },
  to() {
    if (!(Session.get('loading'))) {
      if (this.type === 'COINBASE') {
        return `Q${this.address_to}`
      }
      if (this.type === 'TRANSFER_OUT' || this.type === 'TOKEN_CREATE' || this.type === 'TOKEN_TRANSFER') {
        if (this.addresses_to.length === 1) {
          return `Q${this.addresses_to[0]}`
        }
        return `${this.addresses_to.length} addresses`
      }
      if (this.type === 'TRANSFER_IN') {
        return `Q${FlowRouter.getParam('aId').slice(1, 79)}`
      }
      if (this.type === 'KEYBASE') {
        return `${this.keybaseType} ${this.keybaseUser}`
      }
      return ''
    }
    return false
  },
  from() {
    if (!(Session.get('loading'))) {
      if (this.type === 'COINBASE') {
        return ''
      }
      if (this.type === 'TRANSFER_IN' || this.type === 'TRANSFER_OUT' || this.type === 'TOKEN_CREATE' || this.type === 'TOKEN_TRANSFER' || this.type === 'DOCUMENT_NOTARISATION' || this.type === 'SLAVE' || this.type === 'KEYBASE' || this.type === 'MESSAGE') {
        return `Q${this.address_from}`
      }
      return ''
    }
    return false
  },
  amount() {
    if (!(Session.get('loading'))) {
      if (this.type === 'COINBASE') {
        return `${(this.amount / SHOR_PER_QUANTA).toString()} <small>Quanta</small>`
      }
      if (this.type === 'TRANSFER_IN' || this.type === 'TRANSFER_OUT') {
        if (this.addresses_to.length === 1) {
          const sum = this.amounts.reduce((partialSum, a) => partialSum + a)
          return `${numberToString(sum / SHOR_PER_QUANTA)} <small>Quanta</small>`
        }
        let thisIndex = 0
        const addressTo = `${FlowRouter.getParam('aId').slice(1, 79)}`
        this.addresses_to.forEach((e, i) => {
          if (e === addressTo) {
            thisIndex = i
          }
        })
        return `${numberToString(this.amounts[thisIndex] / SHOR_PER_QUANTA)} <small>Quanta</small>`
      }
      // get from array
      if (this.type === 'TOKEN_CREATE' || this.type === 'TOKEN_TRANSFER') {
        const sum = this.amounts.reduce((partialSum, a) => partialSum + a)
        // TODO: bug here - this should be token decimals which needs returning in token object
        return `${numberToString(sum / SHOR_PER_QUANTA)} <small>${this.symbol}</small>`
      }
      return ''
    }
    return false
  },
  quantity() {
    if (!(Session.get('loading'))) {
      try {
        const q = Session.get('address').totalTransactions
        return q
      } catch (e) {
        return false
      }
    }
    return false
  },
  isTooltipFrom() {
    if (!(Session.get('loading'))) {
      if (this.type === 'COINBASE') {
        return ''
      }
      return 'tooltip'
    }
    return ''
  },
  isTooltipTo() {
    if (!(Session.get('loading'))) {
      if (this.type === 'SLAVE') {
        return ''
      }
      return 'tooltip'
    }
    return ''
  },
})

Template.address.events({
  'click .meta': () => {
    if ($('.meta').hasClass('dropdown-toggle')) {
      $('.meta').removeClass('dropdown-toggle')
      $('.toggle').show()
    } else {
      $('.meta').addClass('dropdown-toggle')
      $('.toggle').hide()
    }
  },
  'mouseover [data-toggle="tooltip"]': (event) => {
    $(event.currentTarget).tooltip({
      boundary: 'window',
    }).tooltip('show')
  },
  'mouseleave [data-toggle="tooltip"]': (event) => {
    $(event.currentTarget).tooltip('hide')
  },
  'click tr': (event) => {
    FlowRouter.go(`/tx/${$(event.currentTarget).attr('data-txhash')}`)
  },
})

Template.address.onRendered(() => {
  Tracker.autorun(() => {
    FlowRouter.watchPathChange()
    Session.set('address', {})
    Session.set('loading', true)
    $('#addressjson').html('')
    $('.data').addClass('loaded')
    $('.meta').addClass('dropdown-toggle')
    $('.toggle').hide()
    // Session.set('qrl', 0)
    // Session.set('status', {})
    renderAddress()
  })
})
