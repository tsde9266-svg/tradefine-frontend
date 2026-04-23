import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { user, isAuthenticated, logout, setUser } = useAuthStore();

  return {
    user,
    isAuthenticated,
    logout,
    setUser,
    isWorker:   user?.role === 'worker',
    isCustomer: user?.role === 'customer',
    isAdmin:    user?.role === 'admin',
  };
}
