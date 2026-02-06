<<<<<<< HEAD
import { UserRole, SubscriptionLevel, User, Product } from './types';
=======
import { UserRole, SubscriptionLevel } from './types';
>>>>>>> f68ad67ad0c2b0887abb21b895af908c5e755d4d

export const COLORS = {
  primary: '#FF5722',
  secondary: '#4CAF50',
};

export const CURRENCY = 'ETB';

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_USER]: 'Super User',
  [UserRole.SYSTEM_ADMIN]: 'System Admin',
  [UserRole.SYSTEM_OPERATOR]: 'System Operator',
  [UserRole.SELLER]: 'Seller',
  [UserRole.BUYER]: 'Buyer',
  [UserRole.SALES_USER]: 'Sales User',
};

export interface SubscriptionTier {
  level: SubscriptionLevel;
  price: number;
  limit: number;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  { level: '1st Level', price: 500, limit: 100 },
  { level: '2nd Level', price: 750, limit: 150 },
  { level: '3rd Level', price: 1000, limit: 250 },
  { level: 'Premium', price: 3000, limit: 1000 },
];

export const MOCK_USERS: User[] = [
  {
    user_id: 'U-ADMIN',
    phone: '0911223344',
    password: '1234',
    first_name: 'HoleView',
    middle_name: 'System',
    last_name: 'Admin',
    role: UserRole.SUPER_USER,
    status: 'active',
    verification_status: 'verified',
    created_at: new Date().toISOString(),
    created_by: 'System'
  },
  {
    user_id: 'U-SELLER-1',
    phone: '0900112233',
    password: '1234',
    first_name: 'Abebe',
    middle_name: 'Beso',
    last_name: 'Bela',
    role: UserRole.SELLER,
    status: 'active',
    verification_status: 'verified',
    created_at: new Date().toISOString(),
    created_by: 'System'
  }
];

export const INITIAL_PRODUCT_TYPES = [
  'Electronics',
  'Computer & Laptop',
  "Women's Fashion",
  "Men's Fashion",
  "Kid's Fashion",
  'Cultural Clothes',
  "Health's",
  'Beauty',
  'Home Appliance & Kitchen',
  'Furniture',
  'Bonda',
  'Mobile',
  'Tablet',
  'Foods & Beverages',
  'others'
];

<<<<<<< HEAD
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'P-1',
    name: 'MacBook Pro M3 Max - 16 inch',
    price: 245000,
    shipping_fee: 500,
    contact_phone: '0911223344',
    unit: 'Unit',
    category: 'Electronics',
    condition: 'Brand New',
    images: ['https://images.unsplash.com/photo-1517336714460-d13886367a7b?q=80&w=1000&auto=format&fit=crop'],
    description: 'High performance Apple Silicon laptop for professionals.',
    seller_name: 'HoleView Admin',
    seller_phone: '0911223344',
    seller_rating: 5.0,
    stock: 5
  },
  {
    id: 'P-2',
    name: 'Traditional Ethiopian Dress (Habesha Kemis)',
    price: 12000,
    shipping_fee: 200,
    contact_phone: '0900112233',
    unit: 'Unit',
    category: 'Cultural Clothes',
    condition: 'Brand New',
    images: ['https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?q=80&w=1000&auto=format&fit=crop'],
    description: 'Hand-woven traditional dress for special ceremonies.',
    seller_name: 'Abebe Beso',
    seller_phone: '0900112233',
    seller_rating: 4.8,
    stock: 12
  }
];
=======
export const INITIAL_PRODUCTS = [];
>>>>>>> f68ad67ad0c2b0887abb21b895af908c5e755d4d
