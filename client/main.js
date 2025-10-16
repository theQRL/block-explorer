// Client entry point, imports all client code

import '/imports/startup/client'
import '/imports/startup/both'

// Theme management using Tailwind dark mode
let theme = LocalStore.get('theme')
if (!theme) {
  theme = 'dark'
  LocalStore.set('theme', 'dark')
}

// Apply theme class to document
if (theme === 'dark') {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}
