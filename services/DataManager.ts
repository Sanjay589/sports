// Data management service for fitness app
import { ExerciseSession, ExerciseGoal, UserProfile, FilterOptions, DashboardData, ChartDataPoint } from '../types/ExerciseData';

export class DataManager {
  private sessions: ExerciseSession[] = [];
  private goals: ExerciseGoal[] = [];
  private userProfile: UserProfile | null = null;

  constructor() {
    this.loadData();
  }

  // Real activity detection - only calculate metrics if user actually performed activity
  private detectRealActivity(motionData: any[], duration: number): boolean {
    if (motionData.length === 0 || duration < 5) {
      return false; // No data or too short
    }

    // Check for actual motion patterns
    const motionCount = motionData.filter(frame => frame.motionDetected).length;
    const motionPercentage = motionCount / motionData.length;
    
    // Require at least 20% motion detection for real activity
    return motionPercentage >= 0.2;
  }

  // Save exercise session with real activity validation
  saveSession(sessionData: Partial<ExerciseSession>, motionData: any[]): ExerciseSession {
    const hasRealActivity = this.detectRealActivity(motionData, sessionData.duration || 0);
    
    const session: ExerciseSession = {
      id: this.generateId(),
      exerciseName: sessionData.exerciseName || 'Unknown',
      reps: hasRealActivity ? (sessionData.reps || 0) : 0,
      sets: sessionData.sets || 1,
      weight: sessionData.weight || 0,
      duration: sessionData.duration || 0,
      calories: hasRealActivity ? (sessionData.calories || 0) : 0,
      date: sessionData.date || new Date(),
      sessionId: sessionData.sessionId || this.generateId(),
      metadata: sessionData.metadata || {
        difficulty: 'medium',
        notes: hasRealActivity ? 'Real activity detected' : 'No real activity detected'
      },
      aiMetrics: hasRealActivity ? (sessionData.aiMetrics || this.getDefaultMetrics()) : this.getNoActivityMetrics(),
      hasRealActivity
    };

    this.sessions.push(session);
    this.saveData();
    return session;
  }

  private getDefaultMetrics() {
    return {
      accuracy: 85,
      formScore: 80,
      technique: {
        posture: 85,
        rangeOfMotion: 80,
        speed: 75,
        consistency: 85
      },
      feedback: ['Good form maintained', 'Keep up the good work'],
      improvements: ['Focus on breathing', 'Maintain steady pace']
    };
  }

  private getNoActivityMetrics() {
    return {
      accuracy: 0,
      formScore: 0,
      technique: {
        posture: 0,
        rangeOfMotion: 0,
        speed: 0,
        consistency: 0
      },
      feedback: ['No activity detected during recording'],
      improvements: ['Ensure you are performing the exercise', 'Check camera positioning']
    };
  }

  // Get sessions with filtering
  getSessions(filters?: FilterOptions): ExerciseSession[] {
    let filteredSessions = [...this.sessions];

    if (filters) {
      if (filters.hasRealActivity) {
        filteredSessions = filteredSessions.filter(session => session.hasRealActivity);
      }

      if (filters.dateRange) {
        filteredSessions = filteredSessions.filter(session => 
          session.date >= filters.dateRange!.start && session.date <= filters.dateRange!.end
        );
      }

      if (filters.exerciseTypes.length > 0) {
        filteredSessions = filteredSessions.filter(session => 
          filters.exerciseTypes!.includes(session.exerciseName)
        );
      }

      if (filters.minReps !== undefined) {
        filteredSessions = filteredSessions.filter(session => session.reps >= filters.minReps!);
      }

      if (filters.maxReps !== undefined) {
        filteredSessions = filteredSessions.filter(session => session.reps <= filters.maxReps!);
      }
    }

    return filteredSessions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Get dashboard data
  getDashboardData(): DashboardData {
    const realActivitySessions = this.sessions.filter(session => session.hasRealActivity);
    
    const totalSessions = realActivitySessions.length;
    const totalReps = realActivitySessions.reduce((sum, session) => sum + session.reps, 0);
    const totalCalories = realActivitySessions.reduce((sum, session) => sum + session.calories, 0);
    const averageAccuracy = realActivitySessions.length > 0 
      ? realActivitySessions.reduce((sum, session) => sum + session.aiMetrics.accuracy, 0) / realActivitySessions.length
      : 0;

    // Calculate current streak
    const currentStreak = this.calculateStreak(realActivitySessions);

    // Weekly progress data
    const weeklyProgress = this.getWeeklyProgressData(realActivitySessions);

    // Exercise comparison data
    const exerciseComparison = this.getExerciseComparisonData(realActivitySessions);

    // Goal progress
    const goalProgress = this.getGoalProgressData();

    return {
      totalSessions,
      totalReps,
      totalCalories,
      averageAccuracy: Math.round(averageAccuracy),
      currentStreak,
      weeklyProgress,
      exerciseComparison,
      goalProgress
    };
  }

  private calculateStreak(sessions: ExerciseSession[]): number {
    if (sessions.length === 0) return 0;

    const sortedSessions = sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].date);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  }

  private getWeeklyProgressData(sessions: ExerciseSession[]): ChartDataPoint[] {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    return last7Days.map(date => {
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === date.getTime();
      });

      const totalReps = daySessions.reduce((sum, session) => sum + session.reps, 0);
      
      return {
        x: date.toLocaleDateString('en-US', { weekday: 'short' }),
        y: totalReps,
        label: `${totalReps} reps`,
        color: totalReps > 0 ? '#34C759' : '#FF3B30'
      };
    });
  }

  private getExerciseComparisonData(sessions: ExerciseSession[]): ChartDataPoint[] {
    const exerciseStats = new Map<string, { totalReps: number; count: number }>();

    sessions.forEach(session => {
      const current = exerciseStats.get(session.exerciseName) || { totalReps: 0, count: 0 };
      exerciseStats.set(session.exerciseName, {
        totalReps: current.totalReps + session.reps,
        count: current.count + 1
      });
    });

    return Array.from(exerciseStats.entries()).map(([exercise, stats]) => ({
      x: exercise,
      y: Math.round(stats.totalReps / stats.count), // Average reps per session
      label: `${Math.round(stats.totalReps / stats.count)} avg reps`,
      color: this.getExerciseColor(exercise)
    }));
  }

  private getExerciseColor(exercise: string): string {
    const colors = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA'];
    const hash = exercise.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  private getGoalProgressData() {
    return this.goals.map(goal => {
      const recentSessions = this.sessions.filter(session => 
        session.exerciseName === goal.exerciseName && 
        session.hasRealActivity &&
        session.date >= goal.startDate &&
        session.date <= goal.endDate
      );

      const current = recentSessions.reduce((sum, session) => sum + session.reps, 0);
      const percentage = Math.round((current / goal.targetReps) * 100);
      const status = percentage >= 80 ? 'on-track' : 'off-track';

      return {
        exerciseName: goal.exerciseName,
        current,
        target: goal.targetReps,
        percentage,
        status
      };
    });
  }

  // Add goal
  addGoal(goal: Omit<ExerciseGoal, 'id' | 'currentProgress'>): ExerciseGoal {
    const newGoal: ExerciseGoal = {
      ...goal,
      id: this.generateId(),
      currentProgress: 0
    };

    this.goals.push(newGoal);
    this.saveData();
    return newGoal;
  }

  // Get goals
  getGoals(): ExerciseGoal[] {
    return [...this.goals];
  }

  // Update user profile
  updateProfile(profile: Partial<UserProfile>): void {
    if (this.userProfile) {
      this.userProfile = { ...this.userProfile, ...profile };
    } else {
      this.userProfile = profile as UserProfile;
    }
    this.saveData();
  }

  // Get user profile
  getProfile(): UserProfile | null {
    return this.userProfile;
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Save data to localStorage
  private saveData(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fitnessApp_sessions', JSON.stringify(this.sessions));
      localStorage.setItem('fitnessApp_goals', JSON.stringify(this.goals));
      localStorage.setItem('fitnessApp_profile', JSON.stringify(this.userProfile));
    }
  }

  // Load data from localStorage
  private loadData(): void {
    if (typeof window !== 'undefined') {
      const sessionsData = localStorage.getItem('fitnessApp_sessions');
      const goalsData = localStorage.getItem('fitnessApp_goals');
      const profileData = localStorage.getItem('fitnessApp_profile');

      if (sessionsData) {
        this.sessions = JSON.parse(sessionsData).map((session: any) => ({
          ...session,
          date: new Date(session.date)
        }));
      }

      if (goalsData) {
        this.goals = JSON.parse(goalsData).map((goal: any) => ({
          ...goal,
          startDate: new Date(goal.startDate),
          endDate: new Date(goal.endDate)
        }));
      }

      if (profileData) {
        this.userProfile = JSON.parse(profileData);
      }
    }
  }

  // Clear all data
  clearAllData(): void {
    this.sessions = [];
    this.goals = [];
    this.userProfile = null;
    this.saveData();
  }
}

// Export singleton instance
export const dataManager = new DataManager();
