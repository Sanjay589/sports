// Data structures for fitness/exercise tracking app

export interface ExerciseSession {
  id: string;
  exerciseName: string;
  reps: number;
  sets?: number;
  weight?: number; // in kg or lbs
  duration: number; // in seconds
  calories: number;
  date: Date;
  sessionId: string;
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard';
    notes?: string;
    location?: string;
    weather?: string;
  };
  aiMetrics: {
    accuracy: number;
    formScore: number;
    technique: {
      posture: number;
      rangeOfMotion: number;
      speed: number;
      consistency: number;
    };
    feedback: string[];
    improvements: string[];
  };
  hasRealActivity: boolean; // Critical: only true if actual user activity detected
}

export interface ExerciseGoal {
  id: string;
  exerciseName: string;
  targetReps: number;
  targetSets?: number;
  targetWeight?: number;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  currentProgress: number;
  isActive: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  weight?: number; // in kg
  height?: number; // in cm
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  preferences: {
    units: 'metric' | 'imperial';
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  goals: ExerciseGoal[];
}

export interface ChartDataPoint {
  x: string | number; // date or session number
  y: number; // reps, weight, or other metric
  label?: string;
  color?: string;
  metadata?: any;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'gauge' | 'scatter' | 'bubble';
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  data: ChartDataPoint[];
  options?: any;
}

export interface FilterOptions {
  dateRange: {
    start: Date;
    end: Date;
  };
  exerciseTypes: string[];
  minReps?: number;
  maxReps?: number;
  hasRealActivity: boolean; // Only show sessions with real activity
}

export interface DashboardData {
  totalSessions: number;
  totalReps: number;
  totalCalories: number;
  averageAccuracy: number;
  currentStreak: number;
  weeklyProgress: ChartDataPoint[];
  exerciseComparison: ChartDataPoint[];
  goalProgress: {
    exerciseName: string;
    current: number;
    target: number;
    percentage: number;
    status: 'on-track' | 'off-track';
  }[];
}
