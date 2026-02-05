import { Meal, ShoppingItem, User, MealType } from "../types";

// Keys for localStorage
const MEALS_KEY = 'planifia_meals';
const ITEMS_KEY = 'planifia_items';
const USER_KEY = 'planifia_user';

// Mock delay to simulate network
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockDb = {
  auth: {
    signIn: async (email: string) => {
      await delay(500);
      const user: User = { id: 'user_123', email };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { user, error: null };
    },
    signOut: async () => {
      localStorage.removeItem(USER_KEY);
      return { error: null };
    },
    getUser: () => {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) as User : null;
    }
  },
  meals: {
    list: async (userId: string) => {
      await delay(200);
      const all = JSON.parse(localStorage.getItem(MEALS_KEY) || '[]');
      return all.filter((m: Meal) => m.user_id === userId);
    },
    add: async (meal: Omit<Meal, 'id'>) => {
      await delay(200);
      const all = JSON.parse(localStorage.getItem(MEALS_KEY) || '[]');
      const newMeal = { ...meal, id: Date.now().toString() };
      all.push(newMeal);
      localStorage.setItem(MEALS_KEY, JSON.stringify(all));
      return newMeal;
    },
    delete: async (id: string) => {
      await delay(200);
      let all = JSON.parse(localStorage.getItem(MEALS_KEY) || '[]');
      all = all.filter((m: Meal) => m.id !== id);
      localStorage.setItem(MEALS_KEY, JSON.stringify(all));
    }
  },
  shoppingItems: {
    list: async (userId: string) => {
      await delay(200);
      const all = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
      return all.filter((i: ShoppingItem) => i.user_id === userId);
    },
    add: async (item: Omit<ShoppingItem, 'id' | 'created_at'>) => {
      await delay(100);
      const all = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
      const newItem = { ...item, id: Date.now().toString() + Math.random(), created_at: Date.now() };
      all.push(newItem);
      localStorage.setItem(ITEMS_KEY, JSON.stringify(all));
      return newItem;
    },
    update: async (id: string, updates: Partial<ShoppingItem>) => {
      await delay(100);
      const all = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
      const idx = all.findIndex((i: ShoppingItem) => i.id === id);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...updates };
        localStorage.setItem(ITEMS_KEY, JSON.stringify(all));
      }
    },
    delete: async (id: string) => {
      await delay(100);
      let all = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
      all = all.filter((i: ShoppingItem) => i.id !== id);
      localStorage.setItem(ITEMS_KEY, JSON.stringify(all));
    },
    deleteByMealId: async (mealId: string) => {
      await delay(100);
      let all = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]');
      // Remove all items that match the mealId
      all = all.filter((i: ShoppingItem) => i.meal_id !== mealId);
      localStorage.setItem(ITEMS_KEY, JSON.stringify(all));
    }
  }
};