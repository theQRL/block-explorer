// Import client startup through a single index entry point

import './routes.js'
import './grpc-console-tests.js'

import('buffer').then(({Buffer}) => {global.Buffer = Buffer})