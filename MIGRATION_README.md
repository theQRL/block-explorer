# QRL Block Explorer - Tailwind CSS Migration

## Overview

This document outlines the migration from Fomantic UI (Semantic UI fork) to Tailwind CSS for the QRL Block Explorer. The migration provides a modern, responsive, and maintainable UI framework.

## What's Changed

### 1. CSS Framework Migration
- **From**: Fomantic UI (Semantic UI fork)
- **To**: Tailwind CSS with custom QRL theme
- **Benefits**: 
  - Smaller bundle size
  - Better performance
  - More maintainable code
  - Modern responsive design
  - Custom design system

### 2. Design System
- **Custom QRL Colors**:
  - `qrl-primary`: #1a1a1a (main background)
  - `qrl-secondary`: #2d2d2d (cards, sidebar)
  - `qrl-accent`: #FFA729 (QRL brand color)
  - `qrl-blue`: #4AAFFF (secondary accent color)
  - `qrl-text`: #ffffff (primary text)
  - `qrl-text-secondary`: #b3b3b3 (secondary text)
  - `qrl-border`: #404040 (borders)

### 3. Component Updates

#### Layout (body.html)
- Modern sidebar navigation with icons
- Responsive mobile menu
- Clean footer design
- Improved accessibility

#### Search Component
- Modern input design with search icon
- Better mobile responsiveness
- Improved focus states

#### Status Component
- Card-based layout
- Better information hierarchy
- Status indicators with colors
- Responsive grid layout

#### Blocks Component
- Modern card design
- Hover effects
- Better data presentation
- Responsive grid

### 4. Mobile Responsiveness
- Mobile-first design approach
- Collapsible sidebar for mobile
- Touch-friendly interface
- Responsive typography and spacing

## Development Workflow

### Building CSS
```bash
# Build CSS once
npm run build:css

# Watch for changes and rebuild
npm run build:css:watch

# Start development server with CSS watching
npm run dev
```

### File Structure
```
public/
├── tailwind.css          # Source Tailwind CSS with custom styles
├── tailwind-output.css   # Compiled CSS (generated)
└── tailwind.config.js    # Tailwind configuration

imports/ui/
├── layouts/body/
│   ├── body.html         # Main layout with sidebar
│   └── body.js          # Mobile menu and theme toggle logic
├── components/
│   ├── search/          # Search component
│   ├── status/          # Network status component
│   └── lastblocks/      # Latest blocks component
└── pages/home/          # Home page layout
```

## Key Features

### 1. Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Collapsible mobile menu
- Responsive grid layouts

### 2. Accessibility
- Focus states for keyboard navigation
- ARIA labels and roles
- High contrast colors
- Screen reader friendly

### 3. Performance
- Purged CSS (only used classes included)
- Optimized bundle size
- Fast loading times
- Smooth animations

### 4. Theme Support
- Dark theme (default)
- Light theme support
- Smooth theme transitions
- Persistent theme selection

## Custom Components

### Button Styles
```html
<!-- Primary button -->
<button class="btn-primary">Click me</button>

<!-- Secondary button -->
<button class="btn-secondary">Click me</button>
```

### Card Component
```html
<div class="card">
  <!-- Card content -->
</div>
```

### Input Fields
```html
<input class="input-field" placeholder="Enter text...">
```

### Status Indicators
```html
<div class="status-indicator status-connected">
  <div class="w-2 h-2 rounded-full bg-current mr-2"></div>
  <span>Connected</span>
</div>
```

## Migration Notes

### 1. Gradual Migration
- Fomantic UI is still included for components not yet migrated
- Can be removed once all components are migrated
- No breaking changes to existing functionality

### 2. JavaScript Compatibility
- All existing JavaScript continues to work
- Mobile menu functionality added
- Theme toggle enhanced

### 3. Styling Approach
- Utility-first CSS approach
- Component-based design system
- Consistent spacing and typography

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design for all screen sizes

## Future Enhancements
- Complete migration of all components
- Remove Fomantic UI dependency
- Add more interactive components
- Implement advanced animations
- Add more theme options

## Troubleshooting

### CSS Not Loading
1. Ensure `tailwind-output.css` is generated
2. Check file paths in `head.html`
3. Run `npm run build:css`

### Mobile Menu Not Working
1. Check JavaScript console for errors
2. Ensure `body.js` is properly loaded
3. Verify DOM elements exist

### Theme Toggle Issues
1. Check LocalStore functionality
2. Verify theme CSS files exist
3. Check browser console for errors

## Contributing
- Follow Tailwind CSS best practices
- Use the established design system
- Test on multiple devices and browsers
- Maintain accessibility standards
