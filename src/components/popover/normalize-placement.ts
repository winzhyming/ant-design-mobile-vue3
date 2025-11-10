export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'

export type DeprecatedPlacement =
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'leftTop'
  | 'leftBottom'
  | 'rightTop'
  | 'rightBottom'

const record: Record<DeprecatedPlacement, Placement> = {
  'topLeft': 'top-start',
  'topRight': 'top-end',
  'bottomLeft': 'bottom-start',
  'bottomRight': 'bottom-end',
  'leftTop': 'left-start',
  'leftBottom': 'left-end',
  'rightTop': 'right-start',
  'rightBottom': 'right-end',
}

export function normalizePlacement(
  placement: Placement | DeprecatedPlacement
): Placement {
  return record[placement as DeprecatedPlacement] ?? placement
}
