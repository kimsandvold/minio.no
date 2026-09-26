import { css } from 'styled-components'

// Blåkopi-rutenett (samme uttrykk som carportplanleggerens hero). Brukes som
// header-bakgrunn på sider uten eget bilde, så de får et enhetlig teknisk preg.
// Legg gjerne til en vignett med `${blueprintGridVignette}` i et ::after-element.
//
// Flaten var tidligere blåkald (#1c2530). Den er nå varm grafitt med et svakt
// terrakotta-skjær fra øvre venstre, slik at de tretten sidene som bruker den
// tilhører samme palett som resten av siden i stedet for å lese som teknisk
// tegneprogram.
export const blueprintGrid = css`
  background-color: #211f1c;
  background-image:
    radial-gradient(110% 80% at 12% 0%, rgba(168, 81, 44, 0.18), transparent 60%),
    linear-gradient(rgba(255, 246, 238, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 246, 238, 0.055) 1px, transparent 1px);
  background-size:
    100% 100%,
    28px 28px,
    28px 28px;
`

export const blueprintGridVignette = css`
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(20, 18, 16, 0.62) 100%);
  pointer-events: none;
`
