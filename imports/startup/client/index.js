// Import client startup through a single index entry point
import './routes.js'

// a few client console test gRPC calls
// import './grpc-console-tests.js'

// Convert bytes to hex
bytesToHex = (byteArray) => {
  return Array.from(byteArray, function(byte) {
    return ('00' + (byte & 0xFF).toString(16)).slice(-2)
  }).join('')
}

// Returns an address ready to send to gRPC API
addressForAPI = (address) => {
  return Buffer.from(address.substring(1), 'hex')
}
