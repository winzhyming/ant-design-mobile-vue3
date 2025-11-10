import Cascader from './cascader.vue'
import { prompt } from './prompt'
import { attachPropertiesToComponent } from '../../utils/attach-properties-to-component'
import { optionSkeleton } from '../cascader-view/option-skeleton'
export default attachPropertiesToComponent(Cascader, {
  prompt,
  optionSkeleton,
})
