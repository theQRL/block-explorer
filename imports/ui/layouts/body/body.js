import './body.html'; // Import the HTML template

// Mobile menu functionality
Template.appBody.onRendered(function() {
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobile-overlay');

  if (mobileMenuToggle && sidebar && mobileOverlay) {
    // Set initial state for sidebar on larger screens
    if (window.innerWidth >= 1280) { // xl breakpoint
      sidebar.classList.remove('closed');
    } else {
      sidebar.classList.add('closed');
    }

    // Toggle mobile menu
    mobileMenuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('closed');
      mobileOverlay.classList.toggle('hidden');
    });

    // Close menu when clicking overlay
    mobileOverlay.addEventListener('click', function() {
      sidebar.classList.add('closed');
      mobileOverlay.classList.add('hidden');
    });

    // Close menu when clicking sidebar links on mobile
    const sidebarLinks = sidebar.querySelectorAll('.sidebar-item');
    sidebarLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (window.innerWidth < 1280) { // xl breakpoint
          sidebar.classList.add('closed');
          mobileOverlay.classList.add('hidden');
        }
      });
    });

    // Handle window resize
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 1280) { // xl breakpoint
        sidebar.classList.remove('closed');
        mobileOverlay.classList.add('hidden');
      } else {
        sidebar.classList.add('closed');
      }
    });
  }

  // Apply initial theme
  const currentTheme = LocalStore.get('theme') || 'dark';
  document.documentElement.className = currentTheme + '-theme';
});

// Theme toggle functionality
Template.appBody.events({
  'click .themeToggle': function(event) {
    event.preventDefault();

    const currentTheme = LocalStore.get('theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    LocalStore.set('theme', newTheme);
    document.documentElement.className = newTheme + '-theme';

    // Re-render chart to apply new theme colors
    if (typeof renderChart === 'function') {
      renderChart();
    }
  }
});

// Global function to close disconnect modal
window.closeDisconnectModal = function() {
  $('.rv-vanilla-modal-overlay-fi').removeClass('is-shown').hide();
  $('.rv-vanilla-modal-fi').removeClass('rv-vanilla-modal-is-open');
  $('#target-modal').hide();
};
