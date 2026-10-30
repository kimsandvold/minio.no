# Graveringsskrifter

TTF-ene her brukes av `src/components/pages/Gravering/graveringSvg.ts` til å
gjøre tekst om til kurver i produksjonsfila. De lastes bare når en gravering
eksporteres – aldri på vanlig sidevisning. Forhåndsvisningen i nettleseren
bruker de samme skriftene fra Google Fonts.

Legger du til en skrift i `graveringFonter` (src/data/gravering.ts), må TTF-en
inn her og i `FONTFILER` i graveringSvg.ts – ellers faller eksporten tilbake på
Montserrat.

| Fil | Skrift | Lisens |
| --- | --- | --- |
| montserrat.ttf | Montserrat | SIL Open Font License 1.1 |
| playfair-display.ttf | Playfair Display | SIL Open Font License 1.1 |
| cormorant-garamond.ttf | Cormorant Garamond | SIL Open Font License 1.1 |
| lora.ttf | Lora | SIL Open Font License 1.1 |
| bebas-neue.ttf | Bebas Neue | SIL Open Font License 1.1 |
| dancing-script.ttf | Dancing Script | SIL Open Font License 1.1 |
| great-vibes.ttf | Great Vibes | SIL Open Font License 1.1 |
| permanent-marker.ttf | Permanent Marker | Apache License 2.0 |

Alle er hentet fra Google Fonts og kan brukes og distribueres fritt, også
kommersielt. Kurvene som havner i en gravert fil regnes som bruk av skriften,
ikke som videredistribusjon av den.
