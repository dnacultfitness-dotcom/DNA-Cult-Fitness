import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'client';
  createdAt?: Timestamp;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText?: string;
  order?: number;
}

export interface MembershipSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  program: string;
  message?: string;
  status: 'new' | 'contacted' | 'closed';
  createdAt: Timestamp;
}

export interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating?: number;
  imageUrl?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  author?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SiteSetting {
  key: string;
  value: string;
}
