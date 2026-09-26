import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  /**
   * Tokens speiles til CSS-variabler slik at komponenter utenfor
   * styled-components (Splide, Leaflet, three-overlays, prerendret markup)
   * kan bruke samme palett.
   */
  :root {
    --paper: ${({ theme }) => theme.colors.paper};
    --surface: ${({ theme }) => theme.colors.surface};
    --sunken: ${({ theme }) => theme.colors.sunken};
    --deep: ${({ theme }) => theme.colors.deep};

    --ink: ${({ theme }) => theme.colors.ink};
    --ink-muted: ${({ theme }) => theme.colors.inkMuted};
    --ink-subtle: ${({ theme }) => theme.colors.inkSubtle};
    --text-light: ${({ theme }) => theme.colors.inkInverted};

    --border: ${({ theme }) => theme.colors.border};
    --border-strong: ${({ theme }) => theme.colors.borderStrong};

    --accent: ${({ theme }) => theme.colors.accent};
    --accent-hover: ${({ theme }) => theme.colors.accentHover};
    --accent-light: ${({ theme }) => theme.colors.accentLight};
    --accent-soft: ${({ theme }) => theme.colors.accentSoft};

    --shadow-sm: ${({ theme }) => theme.shadows.sm};
    --shadow-md: ${({ theme }) => theme.shadows.md};
    --shadow-lg: ${({ theme }) => theme.shadows.lg};
    --shadow-xl: ${({ theme }) => theme.shadows.xl};

    --ease-standard: ${({ theme }) => theme.easing.standard};
    --ease-soft: ${({ theme }) => theme.easing.soft};
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  @media (prefers-reduced-motion: no-preference) {
    html {
      scroll-behavior: smooth;
    }
  }

  /* Respekter systemvalget: slå av bevegelse, ikke bare demp den. */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  html {
    overflow-x: hidden;
    width: 100%;
    /* Fast offset for ankerlenker slik at den flytende navbaren ikke dekker målet. */
    scroll-padding-top: 6rem;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 16px;
    font-weight: 400;
    overflow-x: hidden;
    width: 100%;
    background-color: ${({ theme }) => theme.colors.paper};
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.ink};
    text-rendering: optimizeLegibility;
  }

  p {
    line-height: 1.65;
    font-size: 1rem;
    /* Arver farge fra flaten — mørke seksjoner slipper å overstyre. */
    /* Unngå enslige ord på siste linje i ingresser og brødtekst. */
    text-wrap: pretty;
  }

  h1, h2, h3, h4, h5, h6 {
    line-height: 1.15;
    text-wrap: balance;
  }

  /**
   * Overskrifter i Geist med stram sporing – moderne og rolig. Jo større
   * grad, jo tettere sporing; brødtekst beholder normal sporing.
   */
  h1, h2, h3 {
    font-family: ${({ theme }) => theme.fonts.display};
    letter-spacing: -0.025em;
    /* Bevisst ingen farge her — overskrifter arver fra flaten de står på,
       slik at mørke seksjoner ikke må overstyre hver enkelt. */
  }

  h1 {
    font-weight: 600;
    font-size: ${({ theme }) => theme.fontSizes['4xl']};
    letter-spacing: -0.035em;
    line-height: 1.05;
  }

  h2 {
    font-weight: 600;
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
  }

  h3 {
    font-weight: 600;
    font-size: ${({ theme }) => theme.fontSizes.xl};
  }

  h4, h5, h6 {
    font-family: ${({ theme }) => theme.fonts.body};
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  /**
   * Én synlig fokusring i hele appen. Den gamle var nær-svart og forsvant
   * på mørke flater; terrakotta har kontrast mot både papir og grafitt.
   */
  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
    border-radius: 3px;
  }

  /* Mørke flater får den lyse aksentvarianten. */
  [data-surface='dark'] :focus-visible {
    outline-color: ${({ theme }) => theme.colors.focusInverted};
  }

  /* Ikke vis ring ved museklikk — kun ved tastatur. */
  :focus:not(:focus-visible) {
    outline: none;
  }

  ::selection {
    background: ${({ theme }) => theme.colors.accentSoft};
    color: ${({ theme }) => theme.colors.accentInk};
  }

  /* Bevisst ikke svg/canvas her — ikoner og three/leaflet-lerret styrer seg selv. */
  img, picture, video {
    display: block;
    max-width: 100%;
  }

  /* Splide overrides */
  .splide__pagination__page {
    background: rgba(255, 255, 255, 0.55);
    opacity: 1;
    width: 7px;
    height: 7px;
    transition: background 0.22s var(--ease-standard), width 0.22s var(--ease-standard);
  }

  .splide__pagination__page.is-active {
    background: ${({ theme }) => theme.colors.accentLight};
    transform: none;
    width: 20px;
    height: 7px;
    border-radius: 999px;
  }
`

export default GlobalStyles
