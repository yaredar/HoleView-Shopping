import { UserRole, SubscriptionLevel } from './types';

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

export const MOCK_USERS = [];

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

export const INITIAL_PRODUCTS = [];