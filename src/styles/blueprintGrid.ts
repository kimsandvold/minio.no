import { css } from 'styled-components'

// Blåkopi-rutenett (samme uttrykk som carportplanleggerens hero). Brukes som
// header-bakgrunn på sider uten eget bilde, så de får et enhetlig teknisk preg.
// Legg gjerne til en vignett med `${blueprintGridVignette}` i et ::after-element.
export const blueprintGrid = css`
  background-color: #1c2530;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 28px 28px;
`

export const blueprintGridVignette = css`
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(28, 37, 48, 0.6) 100%);
  pointer-events: none;
`
