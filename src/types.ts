export interface Ingredient {
  name: string;
  confidence: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number; // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  dietaryInfo: string[];
  calories?: number;
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  allergies: string[];
  maxTime: number;
  cuisine?: string;
}

export interface Session {
  id: string;
  visitorId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface AnalyticsData {
  totalVisitors: number;
  totalVisits: number;
  avgTimeSpent: number; // in seconds
  visitsPerDay: { date: string; count: number }[];
}
