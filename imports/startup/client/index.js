// Import client startup through a single index entry point
import './routes.js'

// a few client console test gRPC calls
// import './grpc-console-tests.js'

// Convert bytes to hex
export function bytesToHex(byteArray) {
  return Array.from(byteArray, function(byte) {
    return ('00' + (byte & 0xFF).toString(16)).slice(-2)
  }).join('')
}

// Returns an address ready to send to gRPC API
export function addressForAPI(address) {
  return Buffer.from(address.substring(1), 'hex')
}

// Convert bytes to string
export function bytesToString(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf))
}

// Represent n number of bytes as human readable size
export function formatBytes(bytes, decimals) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals || 3
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  // eslint-disable-next-line
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
