// Video Analysis System for Sports Fitness App
// This module provides real-time analysis of exercise videos

export interface ExerciseAnalysis {
  testType: string;
  duration: number;
  reps: number;
  accuracy: number;
  quality: string;
  score: number;
  formScore: number;
  calories: number;
  heartRate?: number;
  technique: {
    posture: number;
    rangeOfMotion: number;
    speed: number;
    consistency: number;
  };
  feedback: string[];
  improvements: string[];
}

export class VideoAnalyzer {
  private testType: string;
  private startTime: number = 0;
  private repCount: number = 0;
  private lastRepTime: number = 0;
  private repThreshold: number = 0.5; // Minimum time between reps (seconds)
  private analysisData: any[] = [];
  private motionData: any[] = []; // Store motion detection data for real activity validation

  constructor(testType: string) {
    this.testType = testType;
    this.setupAnalysisParameters();
  }

  private setupAnalysisParameters() {
    // Set analysis parameters based on exercise type
    switch (this.testType.toLowerCase()) {
      case 'sit-ups':
        this.repThreshold = 1.0; // Sit-ups need more time between reps
        break;
      case 'push-ups':
        this.repThreshold = 0.8; // Push-ups can be faster
        break;
      case 'vertical jump':
        this.repThreshold = 2.0; // Jumps need more recovery time
        break;
      case 'plank hold':
        this.repThreshold = 0; // Plank is time-based, not rep-based
        break;
      default:
        this.repThreshold = 1.0;
    }
  }

  startAnalysis(): void {
    this.startTime = Date.now();
    this.repCount = 0;
    this.lastRepTime = 0;
    this.analysisData = [];
    this.motionData = [];
  }

  // Simulate real-time analysis (in a real app, this would process video frames)
  analyzeFrame(frameData: any): void {
    const currentTime = (Date.now() - this.startTime) / 1000;
    
    // Simulate motion detection based on exercise type
    const motionDetected = this.detectMotion(frameData);
    
    // Store motion data for real activity validation
    this.motionData.push({
      timestamp: currentTime,
      motionDetected,
      quality: this.assessQuality(frameData)
    });
    
    if (motionDetected && this.canCountRep(currentTime)) {
      this.repCount++;
      this.lastRepTime = currentTime;
    }

    // Store analysis data
    this.analysisData.push({
      timestamp: currentTime,
      motionDetected,
      repCount: this.repCount,
      quality: this.assessQuality(frameData)
    });
  }

  private detectMotion(frameData: any): boolean {
    // Simulate motion detection based on exercise type
    const randomValue = Math.random();
    
    switch (this.testType.toLowerCase()) {
      case 'sit-ups':
        // Sit-ups: detect up and down motion
        return randomValue > 0.7; // 30% chance of motion per frame
      case 'push-ups':
        // Push-ups: detect push and pull motion
        return randomValue > 0.6; // 40% chance of motion per frame
      case 'vertical jump':
        // Vertical jump: detect upward motion
        return randomValue > 0.8; // 20% chance of motion per frame
      case 'plank hold':
        // Plank: detect stability (less motion is better)
        return randomValue > 0.9; // 10% chance of motion per frame
      default:
        return randomValue > 0.5;
    }
  }

  private canCountRep(currentTime: number): boolean {
    return currentTime - this.lastRepTime >= this.repThreshold;
  }

  private assessQuality(frameData: any): number {
    // Simulate quality assessment based on various factors
    const baseQuality = 85;
    const variation = Math.random() * 20 - 10; // ±10 points
    return Math.max(60, Math.min(100, baseQuality + variation));
  }

  getAnalysis(): ExerciseAnalysis {
    const duration = (Date.now() - this.startTime) / 1000;
    const avgQuality = this.analysisData.length > 0 
      ? this.analysisData.reduce((sum, data) => sum + data.quality, 0) / this.analysisData.length
      : 85;

    return {
      testType: this.testType,
      duration: Math.round(duration),
      reps: this.calculateReps(duration),
      accuracy: Math.round(avgQuality),
      quality: this.getQualityLevel(avgQuality),
      score: this.calculateScore(duration, avgQuality),
      formScore: this.calculateFormScore(avgQuality),
      calories: this.calculateCalories(duration, this.repCount),
      technique: this.assessTechnique(),
      feedback: this.generateFeedback(duration, avgQuality),
      improvements: this.generateImprovements(avgQuality)
    };
  }

  // Get motion data for real activity validation
  getMotionData(): any[] {
    return [...this.motionData];
  }

  private calculateReps(duration: number): number {
    if (this.testType.toLowerCase() === 'plank hold') {
      // For plank, return duration in seconds as "hold time"
      return Math.round(duration);
    }
    
    // For other exercises, use detected reps with some realistic variation
    const baseReps = this.repCount;
    const timeBasedEstimate = Math.floor(duration / this.repThreshold);
    
    // Use the higher of detected reps or time-based estimate
    return Math.max(baseReps, timeBasedEstimate);
  }

  private getQualityLevel(avgQuality: number): string {
    if (avgQuality >= 95) return 'ultra';
    if (avgQuality >= 90) return 'high';
    if (avgQuality >= 80) return 'medium';
    return 'low';
  }

  private calculateScore(duration: number, avgQuality: number): number {
    const baseScore = avgQuality;
    const durationBonus = Math.min(10, duration / 10); // Bonus for longer sessions
    const repBonus = Math.min(5, this.repCount / 10); // Bonus for more reps
    
    return Math.round(Math.min(100, baseScore + durationBonus + repBonus));
  }

  private calculateFormScore(avgQuality: number): number {
    // Form score is slightly lower than overall quality
    return Math.max(70, Math.round(avgQuality - 5));
  }

  private calculateCalories(duration: number, reps: number): number {
    // Basic calorie calculation based on exercise type and duration
    const baseCaloriesPerMinute = this.getCaloriesPerMinute();
    const durationMinutes = duration / 60;
    const repBonus = reps * 0.5; // 0.5 calories per rep
    
    return Math.round(baseCaloriesPerMinute * durationMinutes + repBonus);
  }

  private getCaloriesPerMinute(): number {
    switch (this.testType.toLowerCase()) {
      case 'sit-ups': return 8;
      case 'push-ups': return 7;
      case 'vertical jump': return 10;
      case 'plank hold': return 3;
      default: return 6;
    }
  }

  private assessTechnique() {
    const baseScore = 85;
    const variation = Math.random() * 20 - 10;
    
    return {
      posture: Math.max(70, Math.min(100, baseScore + variation)),
      rangeOfMotion: Math.max(70, Math.min(100, baseScore + variation - 2)),
      speed: Math.max(70, Math.min(100, baseScore + variation + 3)),
      consistency: Math.max(70, Math.min(100, baseScore + variation - 1))
    };
  }

  private generateFeedback(duration: number, avgQuality: number): string[] {
    const feedback = [];
    
    if (avgQuality >= 90) {
      feedback.push("Excellent form and technique!");
      feedback.push("Great consistency throughout the exercise");
    } else if (avgQuality >= 80) {
      feedback.push("Good form with minor improvements needed");
      feedback.push("Maintain steady breathing");
    } else {
      feedback.push("Focus on proper form and technique");
      feedback.push("Slow down and concentrate on each movement");
    }

    if (duration >= 60) {
      feedback.push("Great endurance and persistence!");
    }

    if (this.repCount > 0) {
      feedback.push(`Completed ${this.repCount} reps successfully`);
    }

    return feedback;
  }

  private generateImprovements(avgQuality: number): string[] {
    const improvements = [];
    
    if (avgQuality < 85) {
      improvements.push("Focus on maintaining proper posture");
      improvements.push("Control your breathing rhythm");
    }
    
    if (avgQuality < 90) {
      improvements.push("Increase your range of motion");
      improvements.push("Maintain consistent tempo");
    }

    improvements.push("Practice regularly to improve technique");
    improvements.push("Consider working with a trainer for personalized guidance");

    return improvements;
  }
}

// Utility function to create analyzer instance
export function createVideoAnalyzer(testType: string): VideoAnalyzer {
  return new VideoAnalyzer(testType);
}
