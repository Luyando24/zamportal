/**
 * Shared types for ZamPortal Government Portal
 */

export type UUID = string;
export type NRC = string; // Zambian National Registration Card number

export type UserRole = "user" | "admin" | "super_admin" | "institutional_admin" | "staff" | "employee";

export interface User {
  id: UUID;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  nrc?: NRC;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string; // short-lived JWT
  refreshToken?: string; // optional if using refresh flow
  expiresInSec: number;
}

export interface AuthSession {
  userId: UUID;
  role: UserRole;
  portalSlug?: string;
  tokens: AuthTokens;
}

export interface LoginRequest {
  identifier: string; // email or nrc
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nrc: NRC;
  role?: UserRole;
}

export interface RegisterResponse {
  userId: UUID;
}

// Mobile Portal Specific Types
export interface Category {
  id: string;
  title: string;
  icon: string;
  description?: string;
  slug: string;
}

export interface Service {
  id: string;
  title: string;
  icon: string;
  category?: string;
  categoryId?: string;
  description?: string;
  slug: string;
  isPopular?: boolean;
}

export interface Application {
  id: string;
  userId: string;
  serviceId: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'completed';
  formData: Record<string, any>;
  trackingNumber?: string;
  formId?: string;
  formName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface Paged<T> {
  items: T[];
  nextCursor?: string | null;
}

// Legacy support for existing components
export interface RegisterStaffRequest extends RegisterRequest {
  hospitalName?: string;
}

export interface RegisterStaffResponse extends RegisterResponse {
  hospitalId?: string;
}

export interface DemoResponse {
  message: string;
}
