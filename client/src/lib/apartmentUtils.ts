export function getDisplayName(name: string): string {
  const parts = name.split(',');
  if (parts.length > 1) {
    return parts[0].trim();
  }
  const addressPattern = /^\d+\s+/;
  if (addressPattern.test(name)) {
    const words = name.split(' ');
    return words.slice(2).join(' ') || name;
  }
  return name;
}

export const AREA_TO_NEIGHBORHOODS: Record<string, string[]> = {
  'Downtown / Midtown': ['Downtown', 'Midtown'],
  'Montrose / Museum District': ['Montrose', 'Museum District'],
  'The Heights': ['Heights'],
  'Galleria / Uptown': ['Galleria', 'Uptown'],
  'Medical Center / NRG': ['Medical Center', 'NRG'],
  'Katy / West Houston': ['Katy', 'West Houston'],
  'Sugar Land / Fort Bend': ['Sugar Land', 'Fort Bend'],
  'The Woodlands / Spring': ['Woodlands', 'Spring'],
  'Clear Lake / Pearland': ['Clear Lake', 'Pearland'],
  'Other / Not Sure': [],
};

export function mapAreaToNeighborhoods(areas: string[]): string[] {
  const neighborhoods = new Set<string>();
  for (const area of areas) {
    const mapped = AREA_TO_NEIGHBORHOODS[area];
    if (mapped) {
      mapped.forEach(n => neighborhoods.add(n));
    }
  }
  return Array.from(neighborhoods);
}
