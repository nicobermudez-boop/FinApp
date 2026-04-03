import {
  Car, Plane, Home, Gift, Armchair, Shirt, Heart, Film, BookOpen, ShoppingCart,
  Wallet, UtensilsCrossed, PawPrint, Laptop, Shield, Zap, PiggyBank,
  Building2, Coffee, Dumbbell, Music, Package, Tag, DollarSign,
  CreditCard, Baby, Wrench, Scissors, Bus, Train, Bike,
} from 'lucide-react'

// All available icons for categories
export const ICON_MAP = {
  Car, Plane, Home, Gift, Armchair, Shirt, Heart, Film, BookOpen, ShoppingCart,
  Wallet, UtensilsCrossed, PawPrint, Laptop, Shield, Zap, PiggyBank,
  Building2, Coffee, Dumbbell, Music, Package, Tag, DollarSign,
  CreditCard, Baby, Wrench, Scissors, Bus, Train, Bike,
}

// Ordered list for the picker UI
export const ICON_LIST = [
  'ShoppingCart', 'Car', 'Plane', 'Home', 'Armchair', 'Shirt', 'Heart',
  'Film', 'BookOpen', 'Wallet', 'UtensilsCrossed', 'PawPrint', 'Laptop',
  'Shield', 'Zap', 'PiggyBank', 'Building2', 'Coffee', 'Dumbbell', 'Music',
  'Gift', 'Baby', 'Wrench', 'Scissors', 'Bus', 'Train', 'Bike',
  'CreditCard', 'DollarSign', 'Tag', 'Package',
]

export const DEFAULT_ICON = 'Tag'

// Legacy emoji values → icon name. Allows existing DB rows with emojis to
// render correctly without requiring a data migration.
export const EMOJI_TO_ICON = {
  '🚗': 'Car',
  '✈️': 'Plane',
  '🏠': 'Home',
  '🎁': 'Gift',
  '🛋️': 'Armchair',
  '👕': 'Shirt',
  '🏥': 'Heart',
  '🎬': 'Film',
  '📚': 'BookOpen',
  '🛒': 'ShoppingCart',
  '💰': 'Wallet',
  '📦': 'Package',
}

// Keyword rules for auto-suggesting an icon from a category name
const KEYWORD_RULES = [
  { keywords: ['transport', 'auto', 'vehic', 'uber', 'taxi', 'nafta', 'combustib', 'peaje', 'estacionam'], icon: 'Car' },
  { keywords: ['viaj', 'vuelo', 'avion', 'turism', 'vacan', 'travel'], icon: 'Plane' },
  { keywords: ['viviend', 'alquil', 'expens', 'hipotec', 'depart', 'arrend'], icon: 'Home' },
  { keywords: ['regalo', 'donaci', 'present', 'gift'], icon: 'Gift' },
  { keywords: ['hogar', 'mueble', 'equipami', 'decoraci', 'limpieza', 'electrodom'], icon: 'Armchair' },
  { keywords: ['ropa', 'indument', 'vestim', 'calzado', 'cuidado personal', 'peluq', 'estetica', 'belleza', 'spa'], icon: 'Shirt' },
  { keywords: ['salud', 'medic', 'farmac', 'doctor', 'clinica', 'hospital', 'obra social', 'diagnos'], icon: 'Heart' },
  { keywords: ['esparcim', 'entreteni', 'cine', 'teatro', 'streaming', 'ocio', 'recreaci'], icon: 'Film' },
  { keywords: ['educaci', 'escuela', 'colegio', 'univers', 'curso', 'capacit', 'libro'], icon: 'BookOpen' },
  { keywords: ['compra', 'supermercado', 'mercado', 'tienda', 'shop', 'mall'], icon: 'ShoppingCart' },
  { keywords: ['ingreso', 'sueldo', 'salari', 'cobro', 'income'], icon: 'Wallet' },
  { keywords: ['comida', 'aliment', 'restaur', 'gastron', 'food'], icon: 'UtensilsCrossed' },
  { keywords: ['cafe', 'cafeteria', 'kiosk', 'cafe'], icon: 'Coffee' },
  { keywords: ['mascota', 'pet', 'perro', 'gato', 'animal'], icon: 'PawPrint' },
  { keywords: ['tecno', 'computad', 'celular', 'telefon', 'electro', 'software'], icon: 'Laptop' },
  { keywords: ['seguro', 'poliza', 'insurance'], icon: 'Shield' },
  { keywords: ['servicio', 'agua', 'luz', 'gas', 'electric', 'utilities'], icon: 'Zap' },
  { keywords: ['ahorro', 'inversion', 'saving', 'invest', 'plazo'], icon: 'PiggyBank' },
  { keywords: ['banco', 'financ', 'prestamo', 'deuda', 'bank'], icon: 'Building2' },
  { keywords: ['deporte', 'gym', 'gimnasio', 'fitness', 'ejerc', 'sport'], icon: 'Dumbbell' },
  { keywords: ['musica', 'music', 'concert', 'recital'], icon: 'Music' },
  { keywords: ['bebe', 'niño', 'hijo', 'pañal', 'baby', 'child', 'infan'], icon: 'Baby' },
  { keywords: ['manten', 'reparaci', 'arreglo', 'plomer', 'constru'], icon: 'Wrench' },
  { keywords: ['peluq', 'estetica', 'salon', 'barberia'], icon: 'Scissors' },
  { keywords: ['colect', 'omnibus', 'micro', 'bus'], icon: 'Bus' },
  { keywords: ['tren', 'subte', 'metro'], icon: 'Train' },
  { keywords: ['bici', 'bike', 'cicl', 'bicicleta'], icon: 'Bike' },
  { keywords: ['tarjeta', 'credito', 'debito', 'card'], icon: 'CreditCard' },
  { keywords: ['dinero', 'efectiv', 'dolar', 'peso', 'cash'], icon: 'DollarSign' },
]

/**
 * Suggest a Lucide icon name based on the category name using keyword matching.
 * @param {string} name
 * @returns {string} icon name key from ICON_MAP
 */
export function suggestIcon(name) {
  const lower = name.toLowerCase()
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) return rule.icon
  }
  return DEFAULT_ICON
}
