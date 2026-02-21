import {
  createIcons, ArrowRight, ArrowUp, Star, MessageCircle, Coins, Grid3x3, Users, Vote, Image, Box, Activity, Check, Menu, List, Clock, Wallet, FolderTree, ChevronDown, AlertCircle, CheckCircle, XCircle, Info, Copy, ExternalLink, AlertTriangle, Circle, House, Github, ArrowUpRight, ArrowDownLeft, PlusCircle, ArrowLeft,
} from 'lucide'

// Function to initialize Lucide icons
function initializeLucideIcons() {
  createIcons({
    icons: {
      ArrowRight,
      ArrowUp,
      Star,
      MessageCircle,
      Coins,
      Grid3x3,
      Users,
      Vote,
      Image,
      Box,
      Activity,
      Check,
      Menu,
      List,
      Clock,
      Wallet,
      FolderTree,
      ChevronDown,
      AlertCircle,
      CheckCircle,
      XCircle,
      Info,
      Copy,
      ExternalLink,
      AlertTriangle,
      Circle,
      House,
      Github,
      ArrowUpRight,
      ArrowDownLeft,
      PlusCircle,
      ArrowLeft,
    },
  })
}

// Initialize Lucide icons when DOM is ready
Meteor.startup(() => {
  initializeLucideIcons()
  let reinitializeTimeout = null

  // Watch for DOM changes and re-initialize icons
  const observer = new MutationObserver((mutations) => {
    let shouldReinitialize = false
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // Check if any added nodes contain data-lucide attributes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.hasAttribute && node.hasAttribute('data-lucide')) {
              shouldReinitialize = true
            } else if (node.querySelector && node.querySelector('[data-lucide]')) {
              shouldReinitialize = true
            }
          }
        })
      }
    })

    if (shouldReinitialize) {
      if (reinitializeTimeout) {
        clearTimeout(reinitializeTimeout)
      }
      reinitializeTimeout = setTimeout(() => {
        initializeLucideIcons()
        reinitializeTimeout = null
      }, 100)
    }
  })

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
})

// Make the function globally available for manual re-initialization
window.reinitializeLucideIcons = initializeLucideIcons
