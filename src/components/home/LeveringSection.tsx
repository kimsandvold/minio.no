import Leveringskart from '../shared/Leveringskart/Leveringskart'
import { Reveal, Seksjon, Wrap } from '../editorial'

export default function LeveringSection() {
  return (
    <Seksjon id="levering">
      <Wrap>
        <Reveal>
          <Leveringskart />
        </Reveal>
      </Wrap>
    </Seksjon>
  )
}
