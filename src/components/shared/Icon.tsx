import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { IconProp } from '@fortawesome/fontawesome-svg-core'
import {
  faHome, faBriefcase, faGears, faTools, faEnvelope,
  faComments, faCube, faPalette, faHammer, faTruck,
  faTree, faBurn, faShoppingCart, faBars, faTimes,
  faArrowLeft, faArrowRight, faRulerCombined,
  faMinus, faPlus, faTrash, faPaperPlane,
  faSpinner, faCheckCircle, faInfoCircle, faSearch,
  faCheck, faTimesCircle, faExclamationTriangle, faHandPointer,
  faSignOutAlt, faLock, faUser, faClipboardList, faUserShield,
  faChevronDown, faChevronUp,
  faMousePointer, faFont, faSquare, faCircle,
  faUndo, faRedo, faDownload, faSave, faFolderOpen,
  faCopy, faClone, faStar, faArrowUp, faArrowDown, faPencilRuler,
  faMobileAlt, faTabletAlt, faDesktop, faMap,
  faChartBar,
} from '@fortawesome/free-solid-svg-icons'
import { faFacebookF, faInstagram, faGoogle } from '@fortawesome/free-brands-svg-icons'

const iconMap: Record<string, IconProp> = {
  faHome, faBriefcase, faGears, faTools, faEnvelope,
  faComments, faCube, faPalette, faHammer, faTruck,
  faTree, faBurn, faShoppingCart, faBars, faTimes,
  faArrowLeft, faArrowRight, faRulerCombined,
  faMinus, faPlus, faTrash, faPaperPlane,
  faSpinner, faCheckCircle, faInfoCircle, faSearch,
  faCheck, faTimesCircle, faExclamationTriangle, faHandPointer,
  faFacebookF, faInstagram, faGoogle,
  faSignOutAlt, faLock, faUser, faClipboardList, faUserShield,
  faChevronDown, faChevronUp,
  faMousePointer, faFont, faSquare, faCircle,
  faUndo, faRedo, faDownload, faSave, faFolderOpen,
  faCopy, faClone, faStar, faArrowUp, faArrowDown, faPencilRuler,
  faMobileAlt, faTabletAlt, faDesktop, faMap,
  faChartBar,
}

interface IconProps {
  name: string
  className?: string
  spin?: boolean
}

export default function Icon({ name, className, spin }: IconProps) {
  const icon = iconMap[name]
  if (!icon) return null
  return <FontAwesomeIcon icon={icon} className={className} spin={spin} />
}
