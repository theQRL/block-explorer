// Mobile menu functionality
Template.appBody.onRendered(() => {
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuToggle && mobileMenu) {
    // Toggle mobile menu
    mobileMenuToggle.addEventListener('click', function() {
      mobileMenu.classList.toggle('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!mobileMenuToggle.contains(event.target) && !mobileMenu.contains(event.target)) {
        mobileMenu.classList.add('hidden');
      }
    });

    // Close menu when clicking menu links
    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
      link.addEventListener('click', function() {
        mobileMenu.classList.add('hidden');
      });
    });
  }
});
