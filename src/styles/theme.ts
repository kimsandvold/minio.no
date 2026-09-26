/**
 * Designtokens for minio.no
 *
 * Palett-prinsipp: varmnøytral, ikke brun. Gråtonene ligger på ~30° hue med
 * 3–8 % metning, slik at flater leser som papir i stedet for skjerm-grått.
 * Varmen skal komme fra nøytralene, skyggene og fotografiene — ikke fra
 * kulørt chrome. Én aksent (terrakotta) bærer alt som er interaktivt eller
 * fremhevet; alt annet er nøytralt.
 *
 * Bruk `ink`* for mørk tekst og mørke flater, `accent`* for interaksjon.
 * På mørke flater brukes `accentLight` — `accent` har for lav kontrast der.
 */

/** Varmnøytral gråskala — basis for alle flater, kanter og sekundærtekst. */
const neutral = {
  50: '#faf7f2',
  100: '#f4efe8',
  200: '#e8e1d7',
  300: '#d6ccbe',
  400: '#b3a797',
  500: '#7a6f61',
  600: '#6b6157',
  700: '#4a433c',
  800: '#2e2a26',
  900: '#1c1a18',
} as const

const theme = {
  colors: {
    // --- Flater ---
    /** Sidens grunnflate. Varmt papir, ikke hvitt. */
    paper: neutral[50],
    /** Hevet flate: kort, modaler, panel. */
    surface: '#ffffff',
    /** Nedsenket flate: input-felt, striper, tabellrader. */
    sunken: neutral[100],
    /** Dyp flate: footer, mørke seksjoner, navbar. */
    deep: neutral[900],
    /** Dyp flate, ett hakk lysere — for kort på `deep`. */
    deepRaised: neutral[800],

    // --- Tekst ---
    /** Primærtekst på lyse flater. */
    ink: neutral[900],
    /** Sekundærtekst, ingresser, bildetekst. */
    inkMuted: neutral[600],
    /**
     * Tertiærtekst, metadata. Lysest mulige gråtone som fortsatt klarer
     * AA (4.5:1) mot både hvit og papir — ikke gjør den lysere.
     * For rent dekorative ting (kanter, deaktiverte ikoner) bruk neutral[400].
     */
    inkSubtle: neutral[500],
    /** Primærtekst på mørke flater. */
    inkInverted: neutral[50],
    /** Sekundærtekst på mørke flater. */
    inkInvertedMuted: 'rgba(250, 247, 242, 0.72)',

    // --- Kanter ---
    border: neutral[200],
    borderStrong: neutral[300],
    borderInverted: 'rgba(250, 247, 242, 0.14)',

    // --- Aksent (terrakotta) ---
    /** Interaktiv aksent på lyse flater. 5.1:1 mot `paper`. */
    accent: '#a8512c',
    /** Hover/aktiv tilstand for aksenten. */
    accentHover: '#8e4223',
    /** Aksent på mørke flater. 6.5:1 mot `deep`. */
    accentLight: '#e0895f',
    /** Lys aksentflate: badges, fremhevede bokser. */
    accentSoft: '#f7e8de',
    /** Tekst på `accentSoft`. */
    accentInk: '#7a3a1e',
    /** Fokusring. Samme aksent, men alltid synlig mot begge flater. */
    focus: '#a8512c',
    focusInverted: '#e0895f',

    // --- Semantikk (skal ikke brukes som dekor) ---
    success: '#3f7d52',
    successSoft: '#e6f0e8',
    warning: '#b07c1d',
    warningSoft: '#f8eed7',
    error: '#b3382f',
    errorSoft: '#f8e5e3',

    // --- Merkevarefarger (eies av andre, skal ikke tematiseres) ---
    facebook: '#3b5998',
    instagram: '#e4405f',
    /** Instagram-rosa mørknet til 5.1:1 — for tekst og omriss på lys flate. */
    instagramInk: '#c9344f',
    vipps: '#ff5b24',

    // --- Bakoverkompatible alias ---
    darkBg: neutral[900],
    lightBg: neutral[50],
    textLight: neutral[50],
    textDark: neutral[900],
    linkBg: neutral[800],
    white: '#ffffff',
    black: '#000000',

    neutral,
  },
  fonts: {
    /** Brødtekst og UI. */
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Segoe UI", "Helvetica", "Arial", sans-serif',
    /** Overskrifter. Gir siden håndverkskarakter; brukes kun på h1/h2/h3. */
    display: '"Fraunces", "Iowan Old Style", "Palatino Linotype", Georgia, serif',
    /** Mål, kapplister, koder. */
    mono: '"SF Mono", ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace',
  },
  /** Typeskala. Fluid mellom mobil og desktop der det gir mening. */
  fontSizes: {
    xs: '0.78rem',
    sm: '0.875rem',
    base: '1rem',
    md: '1.0625rem',
    lg: 'clamp(1.15rem, 0.5vw + 1rem, 1.3rem)',
    xl: 'clamp(1.35rem, 1vw + 1.1rem, 1.6rem)',
    '2xl': 'clamp(1.7rem, 1.8vw + 1.2rem, 2.1rem)',
    '3xl': 'clamp(2.1rem, 2.8vw + 1.3rem, 2.9rem)',
    '4xl': 'clamp(2.6rem, 4.5vw + 1.3rem, 4rem)',
  },
  breakpoints: {
    mobile: '768px',
    smallMobile: '600px',
    desktop: '769px',
    wideDesktop: '1400px',
  },
  spacing: {
    sectionPadding: '6rem 0 5rem',
    sectionPaddingMobile: '4rem 0 3.5rem',
    sectionPaddingWide: '7.5rem 0 6.5rem',
    containerMax: '1200px',
    /** Smal spalte for lesbar brødtekst (guider, juridisk). */
    proseMax: '68ch',
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
    small: '6px',
    medium: '10px',
    large: '14px',
    xl: '20px',
    round: '50%',
    pill: '999px',
  },
  /**
   * Elevasjonsskala. Skyggene er varme (brunsvarte, ikke rene svarte) —
   * det er dette som får flater til å se belyst ut i stedet for utklippet.
   * Bruk alltid et trinn herfra i stedet for å skrive en ny box-shadow.
   */
  shadows: {
    /** Hvilende kort, input. */
    sm: '0 1px 2px rgba(60, 42, 28, 0.05), 0 1px 3px rgba(60, 42, 28, 0.05)',
    /** Hevet kort, dropdown. */
    md: '0 2px 4px rgba(60, 42, 28, 0.05), 0 4px 14px rgba(60, 42, 28, 0.07)',
    /** Hover på kort, popover. */
    lg: '0 4px 8px rgba(60, 42, 28, 0.05), 0 14px 32px rgba(60, 42, 28, 0.10)',
    /** Modal, fullskjermspanel. */
    xl: '0 8px 16px rgba(60, 42, 28, 0.06), 0 28px 60px rgba(60, 42, 28, 0.15)',
    /** Elementer som flyter over mørke flater eller foto. */
    onDark: '0 8px 32px rgba(0, 0, 0, 0.32)',
    none: 'none',
  },
  transitions: {
    default: '0.22s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    /** Myk utgang — for løft, innsig og panel som åpner seg. */
    soft: '0.35s cubic-bezier(0.22, 1, 0.36, 1)',
    cubicBezier: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
} as const

export type Theme = typeof theme
export default theme
