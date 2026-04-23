export interface Worker {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  trades: string[];
  bio: string;
  pricingNotes: string;
  certifications: string[];
  serviceAreaMiles: number;
  portfolioPhotos: string[];
  isAvailable: boolean;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  reviewCount: number;
  distance?: number;
  status: 'pending' | 'approved' | 'blocked';
  phone: string;
}
