import { ICON_MAP, DEFAULT_ICON } from '../lib/categoryIcons'

/**
 * Renders a Lucide icon for a category given its icon name string.
 * Falls back to the default icon if the name is unknown or missing.
 */
export default function CategoryIcon({ name, size = 20, color = 'currentColor', strokeWidth = 1.75 }) {
  const Icon = ICON_MAP[name] || ICON_MAP[DEFAULT_ICON]
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />
}
