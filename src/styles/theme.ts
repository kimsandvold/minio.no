const theme = {
  colors: {
    darkBg: '#202020',
    lightBg: '#fafaf8',
    textLight: '#f9f9f9',
    textDark: '#1a1a1a',
    linkBg: '#2f2f2f',
    hover: '#1da1f2',
    accent: '#1a1a1a',
    accentHover: '#333333',
    white: '#ffffff',
    black: '#000000',
    facebook: '#3b5998',
    instagram: '#e4405f',
    success: '#4caf50',
    error: '#f44336',
  },
  fonts: {
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", "Helvetica", "Arial", sans-serif',
  },
  breakpoints: {
    mobile: '768px',
    smallMobile: '600px',
    desktop: '769px',
    wideDesktop: '1400px',
  },
  spacing: {
    sectionPadding: '5rem 0 4rem',
    sectionPaddingMobile: '4rem 0 3rem',
    sectionPaddingWide: '6rem 0 5rem',
    containerMax: '1200px',
  },
  zIndex: {
    nav: 1000,
    modal: 10000,
    overlay: 9999,
    menuBackdrop: 9,
    heroContent: 20,
    heroOverlay: 10,
    heroBg: 1,
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    xl: '16px',
    round: '50%',
    pill: '50px',
  },
  transitions: {
    default: '0.3s ease',
    slow: '0.6s ease',
    cubicBezier: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

export type Theme = typeof theme
export default theme
