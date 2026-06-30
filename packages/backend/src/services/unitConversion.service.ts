import { UnitType } from '@grocery-store/shared';

/**
 * Unit Conversion Service
 * Handles normalization of different units for fair price comparison
 */

// Base unit conversions
const WEIGHT_BASE = UnitType.KILOGRAM;
const VOLUME_BASE = UnitType.LITER;

/**
 * Convert quantity to base unit for the unit type
 * Weight: converts to kg
 * Volume: converts to liters
 * Others: return as-is
 */
export function normalizeToBaseUnit(quantity: number, unit: UnitType): number {
  switch (unit) {
    case UnitType.GRAM:
      return quantity / 1000; // Convert grams to kg
    case UnitType.KILOGRAM:
      return quantity;
    case UnitType.MILLILITER:
      return quantity / 1000; // Convert ml to liters
    case UnitType.LITER:
      return quantity;
    case UnitType.PIECE:
    case UnitType.PACKAGE:
      return quantity;
    default:
      return quantity;
  }
}

/**
 * Calculate normalized unit price for comparison
 * Returns price per base unit (kg for weight, liter for volume, per piece for others)
 *
 * Example: 500g @ ₪10 = ₪20/kg
 *          1kg @ ₪18 = ₪18/kg
 */
export function calculateUnitPrice(
  totalPrice: number,
  quantity: number,
  unit: UnitType
): number {
  const normalizedQuantity = normalizeToBaseUnit(quantity, unit);

  if (normalizedQuantity === 0) {
    return 0;
  }

  return totalPrice / normalizedQuantity;
}

/**
 * Convert quantity from one unit to another (same category only)
 */
export function convertUnit(
  quantity: number,
  fromUnit: UnitType,
  toUnit: UnitType
): number {
  // If same unit, return as-is
  if (fromUnit === toUnit) {
    return quantity;
  }

  // Check if both units are in the same category
  const weightUnits = [UnitType.GRAM, UnitType.KILOGRAM];
  const volumeUnits = [UnitType.MILLILITER, UnitType.LITER];

  const isWeightConversion = weightUnits.includes(fromUnit) && weightUnits.includes(toUnit);
  const isVolumeConversion = volumeUnits.includes(fromUnit) && volumeUnits.includes(toUnit);

  if (!isWeightConversion && !isVolumeConversion) {
    throw new Error(`Cannot convert between ${fromUnit} and ${toUnit}`);
  }

  // Convert to base unit first, then to target unit
  const baseQuantity = normalizeToBaseUnit(quantity, fromUnit);

  switch (toUnit) {
    case UnitType.GRAM:
      return baseQuantity * 1000;
    case UnitType.KILOGRAM:
      return baseQuantity;
    case UnitType.MILLILITER:
      return baseQuantity * 1000;
    case UnitType.LITER:
      return baseQuantity;
    default:
      return baseQuantity;
  }
}

/**
 * Get display name for unit type
 */
export function getUnitDisplayName(unit: UnitType, language: 'en' | 'he' = 'he'): string {
  if (language === 'he') {
    const hebrewNames: Record<UnitType, string> = {
      [UnitType.PIECE]: 'יחידה',
      [UnitType.KILOGRAM]: 'ק״ג',
      [UnitType.GRAM]: 'גרם',
      [UnitType.LITER]: 'ליטר',
      [UnitType.MILLILITER]: 'מ״ל',
      [UnitType.PACKAGE]: 'אריזה'
    };
    return hebrewNames[unit];
  }

  const englishNames: Record<UnitType, string> = {
    [UnitType.PIECE]: 'piece',
    [UnitType.KILOGRAM]: 'kg',
    [UnitType.GRAM]: 'g',
    [UnitType.LITER]: 'L',
    [UnitType.MILLILITER]: 'ml',
    [UnitType.PACKAGE]: 'package'
  };
  return englishNames[unit];
}

/**
 * Format price with unit
 */
export function formatUnitPrice(price: number, unit: UnitType, language: 'en' | 'he' = 'he'): string {
  const unitName = getUnitDisplayName(unit, language);
  const formattedPrice = new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS'
  }).format(price);

  if (language === 'he') {
    return `${formattedPrice} ל${unitName}`;
  }
  return `${formattedPrice}/${unitName}`;
}
