import type { InspirationTopic } from '../types/product'

function s(heading: string, body: string): { heading: string; body: string } {
  return { heading, body }
}

export const inspirationTopics: InspirationTopic[] = [
  {
    slug: 'hva-er-diy',
    title: 'Hva er DIY trearbeid?',
    excerpt: 'DIY trearbeid handler om å bygge, reparere og skape med egne hender. Lær hva som kreves og hvordan du kommer i gang.',
    icon: 'faLightbulb',
    sections: [
      {
        heading: 'Hva betyr egentlig DIY?',
        body: 'DIY står for «Do It Yourself» – gjør det selv. I trearbeid betyr det at du planlegger, bygger og vedlikeholder treprodukter uten å kjøpe ferdige løsninger. Du sparer penger, lærer nye ferdigheter og får akkurat det produktet du vil ha. Alt fra en enkel plantekasse til en komplett levegg kan bygges selv med riktig kunnskap og verktøy.',
      },
      {
        heading: 'Forstå materialet: treverk',
        body: 'Tre er et levende materiale som utvider seg og trekker seg sammen med fuktighet. Furu er mykt og lett å bearbeide, gran er lett og populært til konstruksjon, eik er hardt og slitesterkt. Til utendørs bruk må treverket beskyttes mot vær og vind med beis, olje eller maling. Velg alltid materialer som passer til prosjektets belastning og plassering.',
      },
      {
        heading: 'Sikkerhet først',
        body: 'Før du starter noe prosjekt: Bruk vernebriller ved saging, hørselvern ved maskiner, og støvmaske ved sliping. Hold arbeidsområdet ryddig, sørg for god belysning, og les alltid bruksanvisningen til verktøyet. Ha et førstehjelpssett tilgjengelig. Sikkerhet er ikke kjedelig – det er det som gjør at du kan bygge i mange år fremover.',
      },
      {
        heading: 'Hvordan lese en tegning',
        body: 'En byggetegning viser mål, materialer og sammenføyninger. Målene er i millimeter eller centimeter. Streker viser hvor du skal sage, kryss markerer hvor skruer skal inn. Tegningen viser også delene sett ovenfra (plan) og fra siden (profil). Øv deg på å lese tegninger før du starter – det sparer deg for mange feilkutt.',
      },
    ],
  },
  {
    slug: 'forarbeid',
    title: 'Forarbeid & Praktisk',
    excerpt: 'Planlegging, måling, budsjett og byggesøknad – slik legger du et solid grunnlag før du starter treprosjektet.',
    icon: 'faPencilRuler',
    sections: [
      {
        heading: 'Slik måler du riktig',
        body: 'Mål alltid to ganger – kutt én gang. Bruk et stålmålebånd for presisjon. Noter mål med blyant på materialet. For utendørsprosjekter: mål på stedet der produktet skal stå, og ta hensyn til underlagets helling, takrenner, vinduer og dører. Legg til 5-10 cm i kappmarginer når du kjøper inn materialer.',
      },
      {
        heading: 'Budsjett',
        body: 'Lag en komplett materialliste før du handler. Husk å budsjettere med: treverk, skruer og beslag, beis/maling, verktøyleie (hvis du mangler noe), og eventuelt grus/støp til fundament. Legg på 10-15% for uforutsette utgifter. Sammenlign priser på tvers av byggvarehus – prisforskjellene kan være store.',
      },
      {
        heading: 'Byggesøknad – må du søke?',
        body: 'Mindre frittstående bygg under 15 m² krever ofte ikke søknad, men sjekk alltid med kommunen. Levegger over 150 cm kan være søknadspliktige. Pergola med tak regnes som overbygd konstruksjon. I 100-metersbeltet langs sjøen gjelder egne regler. Ta alltid en telefon til kommunen før du bygger – det tar 5 minutter og kan spare deg for store problemer.',
      },
      {
        heading: 'Tegn en skisse',
        body: 'Tegn prosjektet på papir før du handler. Inkluder alle mål (bredde, høyde, dybde), materialtykkelser og hvordan delene skal sammenføyes. En god skisse hjelper deg å oppdage feil før du kapper, og gjør det lettere å beregne riktig materialmengde.',
      },
    ],
  },
  {
    slug: 'verktoy',
    title: 'Verktøyskolen',
    excerpt: 'Must-have og should-have verktøy for treprosjekter – fra det helt grunnleggende til mer avanserte maskiner.',
    icon: 'faTools',
    sections: [
      {
        heading: 'Must-have verktøy',
        body: 'Dette trenger du til ethvert prosjekt: drill med bits (gjerne 18V slagdrill), målebånd (minimum 3 m), vinkel, vannpass, hammer, sag (håndsag eller stikksag), sandpapir korn 80-180, skruer til utendørs bruk (rustfrie A2-stål eller galvaniserte), og vernebriller. Med disse kommer du langt på de fleste nybegynnerprosjekter.',
      },
      {
        heading: 'Should-have verktøy',
        body: 'Når du har bygget et par prosjekter, vil du sette pris på: kappsag (presise vinkelkutt), stikksag (kurver og buer), senkesag (lange, rette kutt i plater), overfres (profiler og kanter), og båndsliper (rask sliping). Disse gjør jobben raskere og mer presis, men er ikke nødvendige for å komme i gang.',
      },
      {
        heading: 'Leie vs. kjøpe',
        body: 'Skal du bare bygge ett prosjekt, lønner det seg ofte å leie spesialverktøy som kappsag, vinkelsliper eller senkesag. De fleste byggvarehus (Montér, Byggmax, Obs BYGG) har verktøykasse til utleie. Til gjentagende prosjekter er det billigere å kjøpe eget. En god drill og stikksag kommer du langt med.',
      },
      {
        heading: 'Sikkerhetsutstyr',
        body: 'Vernebriller ved all saging og sliping. Hørselvern ved kraftig verktøy (kappsag, vinkelsliper). Støvmaske ved sliping av treverk og maling. Arbeidshansker ved håndtering av materialer. Gode sko med sklisikker såle. Sikkerhetsutstyr er ikke valgfritt – det er like viktig som verktøyet selv.',
      },
    ],
  },
  {
    slug: 'valg-av-treverk',
    title: 'Valg av treverk',
    excerpt: 'Impregnert, varmebehandlet eller Kebony? Lær om egenskapene til de vanligste tretypene for utendørs bruk.',
    icon: 'faTree',
    sections: [
      {
        heading: 'Impregnert furu',
        body: 'Rimeligste alternativ. Varer 5-7 år utendørs. Godt valg for budsjettprosjekter og midlertidige løsninger. må behandles med beis eller maling. Fås i vanlige byggvarehus. Obs: unngå trykkimpregnert med kobber til plantekasser der du dyrker spiselige vekster.',
      },
      {
        heading: 'Varmebehandlet furu (ThermoWood)',
        body: 'Miljøvennlig – ingen kjemikalier. Bedre dimensjonsstabilitet (vrir seg mindre). Varer 10-15 år utendørs. Mørkere brun farge som gråner pent over tid. Dyrere enn impregnert, men lengre levetid gjør det billigere over tid. Godt valg for de fleste prosjekter.',
      },
      {
        heading: 'Kebony',
        body: 'Premium biobasert treverk. Norsk teknologi – furu behandlet med biologisk væske fra sukkerproduksjon. Ekstrem holdbarhet: 20+ år. Elegant, mørk brun farge. Miljøvennlig uten giftstoffer. Best for synlige prosjekter der utseende og lang levetid er viktig.',
      },
      {
        heading: 'Møre Royal',
        body: 'Norskprodusert modifisert furu. Varmebehandlet med en spesiell prosess som gir høy holdbarhet og god dimensjonsstabilitet. Godt alternativ til Kebony til en lavere pris. Varer 15-20 år. Godt tilgjengelig hos norske byggvarehus.',
      },
    ],
  },
  {
    slug: 'etterbehandling-og-vedlikehold',
    title: 'Etterbehandling & Vedlikehold',
    excerpt: 'Beis, maling eller olje? Og hvordan holder du treproduktene fine i mange år?',
    icon: 'faPalette',
    sections: [
      {
        heading: 'Oljebeis, dekkbeis eller maling?',
        body: 'Oljebeis trekker dypt inn i treverket og fremhever strukturen. Må fornyes oftere – årlig på horisontale flater. Dekkbeis gir et tynnere sjikt enn maling, god holdbarhet (3-5 år) og skjuler treets struktur delvis. Maling gir best beskyttelse og lengst levetid (5-8 år), men dekker treets struktur helt og krever mer forbehandling. Velg etter hvor mye vedlikehold du vil ha og hvilket utseende du ønsker.',
      },
      {
        heading: 'Slik påfører du',
        body: 'Rengjør med mildt såpevann eller terrassevask før behandling. Påfør i riktig temperatur (10-25°C, ikke i direkte sol). Bruk pensel til kanter og detaljer, rull eller pad til store flater. To tynne strøk er bedre enn ett tykt. La første strøk tørke helt før ny påføring. Lett pussing mellom strøkene gir best resultat.',
      },
      {
        heading: 'Årlig vårrutine',
        body: 'Sjekk alle treprodukter etter vinteren: se etter sprekker, råte eller løse skruer. Vask med mildt såpevann eller terrassevask. Påfør nytt strøk med beis eller olje før sommersesongen. Stram skruer og beslag. Sjekk tak og beslag for skader etter snøtyngde.',
      },
      {
        heading: 'Når bør du beise på nytt?',
        body: 'Sjekk om vann perler seg på overflaten – hvis det trekker inn, er det på tide. Andre tegn: falmet farge, gråning av treverket, eller flassing. Vertikale flater trenger sjeldnere behandling (annethvert år), horisontale flater oftere (årlig).',
      },
    ],
  },
  // ── Blomsterpall – kursmoduler ──
  {
    slug: 'blomsterpall-planlegging',
    title: 'Tegning og planlegging',
    excerpt: 'Slik tegner du din blomsterpall og planlegger prosjektet fra start til slutt.',
    icon: 'faPencilRuler',
    sections: [
      s('Bestem størrelse og plassering', 'Før du tegner, bestem hvor blomsterpallen skal stå. Mål plassen og vurder solforhold. En blomsterpall er typisk 80-120 cm høy, med en topplate på 30-50 cm. Beina kan være 5-10 cm kortere enn totallengden. Tegn en enkel skisse med alle mål – bredde, dybde og høyde på hver del.'),
      s('Tegn en deloversikt', 'Lag en liste over alle delene du trenger: 4 bein, 4 tverrstag, topplate, og eventuelt en hylle. Tegn hver del med mål. Dette blir materiallisten din. En god tegning avslører feil før du kapper – mye billigere enn å oppdage dem under montering.'),
      s('Lag en materialliste og budsjett', 'Regn ut løpemeter treverk basert på deloversikten. Legg til 10-20 % i kappmarginer. Noter også skruer, treskruer til utendørs bruk, trelim, sandpapir og overflatebehandling. Sjekk priser på byggvarehus eller nett. Et budsjett hjelper deg å velge riktig materialkvalitet.'),
    ],
  },
  {
    slug: 'blomsterpall-materialvalg',
    title: 'Velg riktig treverk',
    excerpt: 'Hvilket treverk passer best til blomsterpallen? Lær om impregnert, varmebehandlet og Kebony.',
    icon: 'faTree',
    sections: [
      s('Impregnert furu – budsjettvalget', 'Impregnert furu er rimeligst og varer 5-7 år utendørs. Perfekt for din første blomsterpall. Husk å beise eller olje etter bygging for lengre levetid. Unngå trykkimpregnert med kobber hvis du skal dyrke urter eller spiselige vekster i pallen.'),
      s('Varmebehandlet furu (ThermoWood)', 'Miljøvennlig uten kjemikalier. Bedre dimensjonsstabilitet – vrir seg mindre enn impregnert. Varer 10-15 år. Mørk brun farge som gråner pent. Litt dyrere, men lengre levetid gjør det billigere over tid. Et godt valg for blomsterpallen.'),
      s('Kebony – premiumvalget', 'Norsk biobasert treverk med ekstrem holdbarhet (20+ år). Elegant mørk brun farge. Miljøvennlig uten giftstoffer. Dyrt, men perfekt hvis blomsterpallen skal stå på en synlig terrasse eller ved inngangspartiet.'),
      s('Hva passer din blomsterpall best?', 'Til en blomsterpall som skal stå ute, anbefaler vi varmebehandlet furu. Det gir god holdbarhet til en fornuftig pris. Hvis du er nybegynner og vil holde kostnadene nede, velg impregnert furu og påfør god overflatebehandling.'),
    ],
  },
  {
    slug: 'blomsterpall-verktoy',
    title: 'Verktøy du trenger',
    excerpt: 'Alt verktøyet du trenger for å bygge blomsterpallen – fra det helt grunnleggende til kjekke tillegg.',
    icon: 'faTools',
    sections: [
      s('Grunnleggende verktøy', 'Drill med bits (18V slagdrill anbefales), kappsag eller stikksag, målebånd (minst 3 m), vinkel, sandpapir korn 80-180, skruer til utendørs bruk (rustfrie A2-stål), og vernebriller. Dette er alt du strengt tatt trenger.'),
      s('Kjekt å ha', 'Vannpass for å sjekke at pallen står rett. En gummiklubbe hvis du må justere deler. Tvingeklemmer til å holde deler på plass mens du skrur. En overfres hvis du vil runde av kanter for en mer profesjonell finish.'),
      s('Sikkerhetsutstyr', 'Vernebriller ved saging og sliping. Støvmaske ved sliping av treverk. Arbeidshansker ved håndtering av materialer. Hørselvern ved bruk av kappsag. Sikkerhet er ikke valgfritt – beskyt deg selv fra første kutt.'),
    ],
  },
  {
    slug: 'blomsterpall-kapping',
    title: 'Kapping og forberedelse',
    excerpt: 'Slik kapper du delene presist og klargjør dem før montering.',
    icon: 'faCut',
    sections: [
      s('Mål og merk', 'Overfør målene fra tegningen til treverket. Bruk blyant – ikke penn eller tusj (blyant synes ikke gjennom beis). Merk hver del med tall eller navn så du vet hvor den skal være. Sjekk to ganger før du kapper: mål en gang til – særlig på bein og topplate.'),
      s('Kapping av bein og tverrstag', 'Kapp beina i nøyaktig samme lengde. Bruk kappsag for rette, rene kutt. Hvis du bruker stikksag, bruk en anleggskant for å få rette kutt. Kapp tverrstagene 5 cm kortere enn avstanden mellom beina – de skal sitte på innsiden.'),
      s('Sliping og klargjøring', 'Puss alle flater med sandpapir. Start med korn 80 for å fjerne grove kanter, så korn 120, og avslutt med korn 180 for en glatt overflate. Rund av skarpe kanter lett – det gir et mer profesjonelt utseende og gjør overflatebehandlingen enklere.'),
    ],
  },
  {
    slug: 'blomsterpall-montering',
    title: 'Montering av blomsterpallen',
    excerpt: 'Trinn-for-trinn montering av blomsterpallen – fra bein til topplate.',
    icon: 'faHammer',
    sections: [
      s('Monter bein og tverrstag', 'Legg to bein flatt på bakken. Skru fast tverrstaget 5-10 cm fra toppen på innsiden av beina. Gjenta med de to andre beina. Forbor alle skruehull for å unngå sprekker. Bruk trelim i skjøtene for ekstra styrke.'),
      s('Sammen binding av rammen', 'Reis de to beinparene og skru fast de resterende tverrstagene – ett nederst og ett midt på. Sjekk med vannpass at alt er i vater. Stram skruene godt, men ikke så hardt at treverket sprekker.'),
      s('Fest topplaten', 'Senter topplaten på rammen og skru fast fra undersiden. Bruk skruer som er korte nok til ikke å gå gjennom topplaten. Hvis du vil ha en hylle, skru fast et par bærelekter på innsiden og legg en plate oppå.'),
      s('Sjekk stabilitet', 'Sett blomsterpallen på et plant underlag. Vugg den forsiktig – stram eventuelle skruer eller juster beina. En stabil blomsterpall skal ikke vippe eller vingle. Hvis underlaget er ujevnt, kan du justere med gummiføtter eller filtputer under beina.'),
    ],
  },
  {
    slug: 'blomsterpall-overflatebehandling',
    title: 'Overflatebehandling',
    excerpt: 'Beskytt blomsterpallen mot vær og vind med riktig overflatebehandling.',
    icon: 'faPalette',
    sections: [
      s('Velg riktig behandling', 'Til en blomsterpall anbefales oljebeis eller dekkbeis. Oljebeis trekker inn i treet og fremhever strukturen – perfekt for varmebehandlet furu. Dekkbeis gir mer farge og bedre beskyttelse. Maling er også et alternativ, men dekker treets struktur helt.'),
      s('Slik påfører du', 'Påfør første strøk før montering – da kommer du til på alle sider. Bruk en god pensel. La tørke i henhold til produsentens anbefaling (vanligvis 12-24 timer). Påfør et andre strøk etter lett pussing mellom strøkene.'),
      s('Vedlikehold', 'Sjekk blomsterpallen hver vår. Vask med mildt såpevann og påfør et nytt strøk med beis eller olje. Horisontale flater (topplaten) slites raskest og trenger oftere behandling. Med årlig vedlikehold varer blomsterpallen i 10-15 år.'),
    ],
  },
]
