export interface Notification {
  id: string;
  userId: string;
  type: 'new_review' | 'account_approved' | 'profile_saved' | 'call_received';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
