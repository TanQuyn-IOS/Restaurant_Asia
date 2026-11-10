/**
 * Restaurant Data Repository (SQLite & Relational Storage Layer)
 * 
 * Abstract repository providing typed CRUD operations for:
 * - Accounts (UserAccount)
 * - Areas & Tables
 * - Menu & Items
 * - Active & Completed Orders
 * - Staff & Shifts
 * - Service Requests
 * 
 * This layer abstracts storage so transitioning from LocalStorage to SQLite
 * (e.g. SQLite3, better-sqlite3, Cloud SQL, or API endpoints) requires modifying
 * only this file without altering any React UI components.
 */

import {
  UserAccount,
  Area,
  Table,
  MenuItem,
  Order,
  Staff,
  ShiftSchedule,
  ServiceRequest
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_AREAS,
  INITIAL_TABLES,
  INITIAL_MENU_ITEMS,
  INITIAL_STAFF,
  INITIAL_ORDERS,
  INITIAL_COMPLETED_ORDERS,
  INITIAL_SHIFTS,
  INITIAL_SERVICE_REQUESTS
} from '../mockData';

export interface IRestaurantRepository {
  // Accounts
  getAccounts(): Promise<UserAccount[]>;
  saveAccounts(accounts: UserAccount[]): Promise<void>;
  
  // Areas & Tables
  getAreas(): Promise<Area[]>;
  saveAreas(areas: Area[]): Promise<void>;
  getTables(): Promise<Table[]>;
  saveTables(tables: Table[]): Promise<void>;
  
  // Menu Items
  getMenuItems(): Promise<MenuItem[]>;
  saveMenuItems(items: MenuItem[]): Promise<void>;
  
  // Staff & Shifts
  getStaff(): Promise<Staff[]>;
  saveStaff(staff: Staff[]): Promise<void>;
  getShifts(): Promise<ShiftSchedule[]>;
  saveShifts(shifts: ShiftSchedule[]): Promise<void>;
  
  // Orders
  getActiveOrders(): Promise<Order[]>;
  saveActiveOrders(orders: Order[]): Promise<void>;
  getCompletedOrders(): Promise<Order[]>;
  saveCompletedOrders(orders: Order[]): Promise<void>;
  
  // Service Requests
  getServiceRequests(): Promise<ServiceRequest[]>;
  saveServiceRequests(requests: ServiceRequest[]): Promise<void>;
  
  // Utilities
  resetDatabaseToSeed(): Promise<void>;
}

class LocalStorageSqliteAdapter implements IRestaurantRepository {
  private readonly KEYS = {
    accounts: 'rest_accounts',
    areas: 'rest_areas',
    tables: 'rest_tables',
    menuItems: 'rest_menu_items',
    staff: 'rest_staff',
    shifts: 'rest_shifts',
    activeOrders: 'rest_active_orders',
    completedOrders: 'rest_completed_orders',
    serviceRequests: 'rest_service_requests'
  };

  // 1. Accounts
  async getAccounts(): Promise<UserAccount[]> {
    const raw = localStorage.getItem(this.KEYS.accounts);
    if (raw) {
      try {
        const parsed: UserAccount[] = JSON.parse(raw);
        // Ensure all passwords default to '123'
        return parsed.map((a) => ({ ...a, password: '123' }));
      } catch (e) {
        console.error('Error loading accounts from storage', e);
      }
    }
    return INITIAL_ACCOUNTS.map((a) => ({ ...a, password: '123' }));
  }

  async saveAccounts(accounts: UserAccount[]): Promise<void> {
    localStorage.setItem(this.KEYS.accounts, JSON.stringify(accounts));
  }

  // 2. Areas & Tables
  async getAreas(): Promise<Area[]> {
    const raw = localStorage.getItem(this.KEYS.areas);
    return raw ? JSON.parse(raw) : INITIAL_AREAS;
  }

  async saveAreas(areas: Area[]): Promise<void> {
    localStorage.setItem(this.KEYS.areas, JSON.stringify(areas));
  }

  async getTables(): Promise<Table[]> {
    const raw = localStorage.getItem(this.KEYS.tables);
    return raw ? JSON.parse(raw) : INITIAL_TABLES;
  }

  async saveTables(tables: Table[]): Promise<void> {
    localStorage.setItem(this.KEYS.tables, JSON.stringify(tables));
  }

  // 3. Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    const raw = localStorage.getItem(this.KEYS.menuItems);
    return raw ? JSON.parse(raw) : INITIAL_MENU_ITEMS;
  }

  async saveMenuItems(items: MenuItem[]): Promise<void> {
    localStorage.setItem(this.KEYS.menuItems, JSON.stringify(items));
  }

  // 4. Staff & Shifts
  async getStaff(): Promise<Staff[]> {
    const raw = localStorage.getItem(this.KEYS.staff);
    return raw ? JSON.parse(raw) : INITIAL_STAFF;
  }

  async saveStaff(staff: Staff[]): Promise<void> {
    localStorage.setItem(this.KEYS.staff, JSON.stringify(staff));
  }

  async getShifts(): Promise<ShiftSchedule[]> {
    const raw = localStorage.getItem(this.KEYS.shifts);
    return raw ? JSON.parse(raw) : INITIAL_SHIFTS;
  }

  async saveShifts(shifts: ShiftSchedule[]): Promise<void> {
    localStorage.setItem(this.KEYS.shifts, JSON.stringify(shifts));
  }

  // 5. Orders
  async getActiveOrders(): Promise<Order[]> {
    const raw = localStorage.getItem(this.KEYS.activeOrders);
    return raw ? JSON.parse(raw) : INITIAL_ORDERS;
  }

  async saveActiveOrders(orders: Order[]): Promise<void> {
    localStorage.setItem(this.KEYS.activeOrders, JSON.stringify(orders));
  }

  async getCompletedOrders(): Promise<Order[]> {
    const raw = localStorage.getItem(this.KEYS.completedOrders);
    return raw ? JSON.parse(raw) : INITIAL_COMPLETED_ORDERS;
  }

  async saveCompletedOrders(orders: Order[]): Promise<void> {
    localStorage.setItem(this.KEYS.completedOrders, JSON.stringify(orders));
  }

  // 6. Service Requests
  async getServiceRequests(): Promise<ServiceRequest[]> {
    const raw = localStorage.getItem(this.KEYS.serviceRequests);
    return raw ? JSON.parse(raw) : INITIAL_SERVICE_REQUESTS;
  }

  async saveServiceRequests(requests: ServiceRequest[]): Promise<void> {
    localStorage.setItem(this.KEYS.serviceRequests, JSON.stringify(requests));
  }

  // Utilities
  async resetDatabaseToSeed(): Promise<void> {
    localStorage.clear();
  }
}

// Export singleton repository instance
export const dbRepository: IRestaurantRepository = new LocalStorageSqliteAdapter();
