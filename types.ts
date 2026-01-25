export enum UserRole {
  SUPER_USER = 'SUPER_USER',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  SYSTEM_OPERATOR = 'SYSTEM_OPERATOR',
  SELLER = 'SELLER',
  BUYER = 'BUYER',
  SALES_USER = 'SALES_USER'
}

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface User {
  user_id: string;
  phone: string;
  password?: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  email?: string;
  profile_photo?: string; // Base64
  created_at: string; // ISO String
  created_by: string; // Name or ID of creator
  role: UserRole;
  status: 'active' | 'deactive';
  id_photo?: string; // Base64 (Front)
  id_photo_back?: string; // Base64 (Back)
  trade_license?: string; // Base64 (Business License)
  delivery_address?: string;
  id_number?: string;
  tin_number?: string;
  verification_status?: VerificationStatus;
  rating?: number;
  rating_count?: number;
}

export type SubscriptionLevel = '1st Level' | '2nd Level' | '3rd Level' | 'Premium';

export interface SubscriptionTier {
  level: SubscriptionLevel;
  price: number;
  limit: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  level: SubscriptionLevel;
  product_limit: number;
  duration_years: number;
  amount: number;
  payment_proof?: string; // Base64 image of receipt
  status: 'pending' | 'completed' | 'expired' | 'declined';
  request_date: string;
  start_date?: string;
  end_date?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  shipping_fee: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_name: string;
  buyer_phone: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'rejected';
  timestamp: string;
  delivery_date?: string;
  seller_name: string;
  seller_phone: string;
  is_paid_confirmed: boolean;
}

export interface Ad {
  id: string;
  title: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  destinationUrl: string;
  isActive: boolean;
  adsenseCode?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  shipping_fee: number;
  contact_phone: string;
  unit: string;
  category: string;
  condition: 'Brand New' | 'Used';
  images: string[];
  description: string;
  colors?: string[];
  sizes?: string[];
  seller_name: string;
  seller_phone: string;
  seller_rating: number;
  stock: number;
}

export interface Message {
  id: string;
  sender: string;
  text?: string;
  file?: string; // Base64 for images/files
  fileName?: string;
  timestamp: string;
  isMe: boolean;
}

export interface ChatThread {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
}