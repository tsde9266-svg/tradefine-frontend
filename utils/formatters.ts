import { formatDistanceToNow, parseISO } from 'date-fns';

export function formatDistance(metres: number): string {
  const miles = metres / 1609.344;
  if (miles < 0.1) return 'nearby';
  if (miles < 10) return `${miles.toFixed(1)} miles`;
  return `${Math.round(miles)} miles`;
}

export function formatDate(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatEta(distanceMetres: number): string {
  const hours = distanceMetres / 1000 / 30; // assume 30 km/h
  const minutes = Math.ceil(hours * 60);
  if (minutes < 60) return `~${minutes} min`;
  return `~${Math.round(hours)}h`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
