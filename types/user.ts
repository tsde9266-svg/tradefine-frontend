export interface User {
  id: string;
  role: 'customer' | 'worker' | 'admin';
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  createdAt: string;
}
