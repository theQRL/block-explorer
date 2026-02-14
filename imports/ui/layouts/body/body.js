import { EXPLORER_VERSION } from '../../../startup/both/index.js'
// Mobile menu functionality
Template.appBody.onRendered(() => {
  // Initialize Lucide icons for the main app
  setTimeout(() => {
    if (window.reinitializeLucideIcons) {
      window.reinitializeLucideIcons()
    }
  }, 100)

  const mobileMenuToggle = document.getElementById('mobile-menu-toggle')
  const mobileMenu = document.getElementById('mobile-menu')

  if (mobileMenuToggle && mobileMenu) {
    // Toggle mobile menu
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden')
    })

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (
        !mobileMenuToggle.contains(event.target)
        && !mobileMenu.contains(event.target)
      ) {
        mobileMenu.classList.add('hidden')
      }
    })

    // Close menu when clicking menu links
    const menuLinks = mobileMenu.querySelectorAll('a')
    menuLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden')
      })
    })
  }
})
Template.appBody.helpers({
  EXPLORER_VERSION: () => EXPLORER_VERSION,
  currentYear: () => new Date().getFullYear(),
})
