// Client entry point, imports all client code

import '/imports/startup/client'
import '/imports/startup/both'


let x = LocalStore.get('theme')
if (!x) {
  x = 'dark'
  LocalStore.set('theme', 'dark')
}

if (x === 'light') {
  import '/public/light.css' /* eslint-disable-line */
} else {
  import '/public/dark.css'
}