import { db } from "./db";
import {
  NetworkError,
  AuthError,
  validateStaffData,
} from "./errors";
import type {
  AuthSession,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  Category,
  Service,
  Application,
} from "@shared/api";
import { v4 as uuidv4 } from "uuid";
import { sha256Hex } from "@/lib/crypto";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const USE_MOCK =
  (import.meta.env.VITE_USE_MOCK as string | undefined) === "true";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      ...init,
    });
    
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401) {
        throw new AuthError(text || "Authentication failed");
      }
      throw new Error(text || `HTTP ${res.status}`);
    }
    
    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError("Unable to connect to server");
    }
    throw error;
  }
}

export const Api = {
  async login(payload: LoginRequest): Promise<AuthSession> {
    if (USE_MOCK) return mock.login(payload);
    return http<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  
  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    validateStaffData({
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });
    if (USE_MOCK) return mock.register(payload);
    return http<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Mobile / Portal API
  async getCategories(): Promise<Category[]> {
    if (USE_MOCK) return mock.getCategories();
    return http<Category[]>("/categories");
  },

  async getPopularServices(): Promise<Service[]> {
    if (USE_MOCK) return mock.getPopularServices();
    return http<Service[]>("/services/popular");
  },

  async searchServices(query: string): Promise<Service[]> {
    if (USE_MOCK) return mock.searchServices(query);
    return http<Service[]>(`/services/search?query=${encodeURIComponent(query)}`);
  },

  async getApplications(): Promise<Application[]> {
    if (USE_MOCK) return mock.getApplications();
    return http<Application[]>("/applications");
  },

  async getProfile(): Promise<any> {
    if (USE_MOCK) return mock.getProfile();
    return http<any>("/profile");
  },
  
  // Legacy support
  async registerStaff(payload: any): Promise<any> {
    return this.register(payload);
  }
};

const mock = {
  async login({ email, password }: LoginRequest): Promise<AuthSession> {
    const user = await db.users.where({ email }).first();
    if (!user) throw new Error("Account not found. Please register.");
    const hash = await sha256Hex(password);
    if ((user as any).passwordHash !== hash) throw new Error("Invalid credentials");
    return {
      userId: user.id,
      role: user.role,
      tokens: { accessToken: uuidv4(), expiresInSec: 3600 },
     };
  },
  
  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const existing = await db.users
      .where({ email: payload.email })
      .first();
    if (existing) throw new Error("Email already registered");
    
    const now = new Date().toISOString();
    const user: any = {
      id: uuidv4(),
      email: payload.email,
      passwordHash: await sha256Hex(payload.password),
      role: payload.role || "user",
      firstName: payload.firstName,
      lastName: payload.lastName,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await db.users.put(user);
    return { userId: user.id };
  },

  async getCategories(): Promise<Category[]> {
    return [
      { id: '1', title: 'Citizens', icon: 'people', slug: 'citizens' },
      { id: '2', title: 'Businesses', icon: 'business', slug: 'businesses' },
    ];
  },

  async getPopularServices(): Promise<Service[]> {
    return [
      { id: '1', title: 'NRC Application', icon: 'fingerprint', slug: 'nrc' },
    ];
  },

  async searchServices(query: string): Promise<Service[]> {
    return [];
  },

  async getApplications(): Promise<Application[]> {
    return [];
  },

  async getProfile(): Promise<any> {
    return null;
  }
};

export async function enqueueSync(op: Parameters<typeof db.syncQueue.add>[0]) {
  await db.syncQueue.add(op as any);
}
