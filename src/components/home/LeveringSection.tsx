import Leveringskart from '../shared/Leveringskart/Leveringskart'
import { Reveal, Seksjon, Wrap } from './shared'

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
