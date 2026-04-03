import { ICON_MAP, EMOJI_TO_ICON, DEFAULT_ICON } from '../lib/categoryIcons'

/**
 * Renders a Lucide icon for a category given its icon name string.
 * Transparently handles legacy emoji values stored in the DB.
 * Falls back to the default icon if the name is unknown or missing.
 */
export default function CategoryIcon({ name, size = 20, color = 'currentColor', strokeWidth = 1.75 }) {
  const resolved = EMOJI_TO_ICON[name] || name
  const Icon = ICON_MAP[resolved] || ICON_MAP[DEFAULT_ICON]
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />
}
