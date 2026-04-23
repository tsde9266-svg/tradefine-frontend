export interface Review {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string | null;
  toWorkerId: string;
  rating: number;
  text: string;
  photos: string[];
  reply: string | null;
  createdAt: string;
}
