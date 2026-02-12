import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
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

  html {
    overflow-x: hidden;
    width: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: 16px;
    font-weight: 400;
    overflow-x: hidden;
    width: 100%;
    background-color: ${({ theme }) => theme.colors.lightBg};
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.textDark};
  }

  p {
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.textDark};
    font-size: 1rem;
  }

  h1, h2, h3, h4, h5, h6 {
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  h1 {
    font-weight: 700;
  }

  h2, h3, h4, h5, h6 {
    font-weight: 600;
  }

  a:focus, button:focus {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }

  /* Splide overrides */
  .splide__pagination__page {
    background: rgba(255, 255, 255, 0.7);
    opacity: 1;
    width: 8px;
    height: 8px;
  }

  .splide__pagination__page.is-active {
    background: ${({ theme }) => theme.colors.accent};
    width: 10px;
    height: 10px;
  }
`

export default GlobalStyles
