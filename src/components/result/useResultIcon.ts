import { computed } from 'vue'
import {
  CheckCircleFill,
  CloseCircleFill,
  InformationCircleFill,
  ClockCircleFill,
  ExclamationCircleFill,
} from 'ant-mobile-icons'
import { useConfig } from '../config-provider/useConfig'

export type ResultStatus = 'success' | 'error' | 'info' | 'waiting' | 'warning'

export function useResultIcon(status?: ResultStatus) {
  const { result: componentConfig = {} } = useConfig()

  const defaultIcons = {
    successIcon: CheckCircleFill,
    errorIcon: CloseCircleFill,
    infoIcon: InformationCircleFill,
    waitingIcon: ClockCircleFill,
    warningIcon: ExclamationCircleFill,
  }

  // 如果有配置，可以合并
  const mergedIcons = { ...defaultIcons, ...componentConfig }

  return computed(() => {
    if (!status) return null

    switch (status) {
      case 'success':
        return mergedIcons.successIcon
      case 'error':
        return mergedIcons.errorIcon
      case 'info':
        return mergedIcons.infoIcon
      case 'waiting':
        return mergedIcons.waitingIcon
      case 'warning':
        return mergedIcons.warningIcon
      default:
        return null
    }
  })
}
