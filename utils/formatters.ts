import { formatDistanceToNow, parseISO } from 'date-fns';

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)}m away`;
  const km = metres / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)}km away`;
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
