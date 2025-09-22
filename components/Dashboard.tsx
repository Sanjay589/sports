// Comprehensive fitness dashboard with multiple chart types
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ChartContainer from './charts/ChartContainer';
import { dataManager } from '../services/DataManager';
import { DashboardData, ChartDataPoint, FilterOptions, ExerciseSession } from '../types/ExerciseData';

const { width } = Dimensions.get('window');

interface DashboardProps {
  onSessionPress?: (session: ExerciseSession) => void;
}

export default function Dashboard({ onSessionPress }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'week' | 'month'>('week');
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [selectedFilter]);

  const loadDashboardData = () => {
    const data = dataManager.getDashboardData();
    setDashboardData(data);
  };

  const getFilteredData = () => {
    const now = new Date();
    let startDate = new Date();

    switch (selectedFilter) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const filters: FilterOptions = {
      dateRange: { start: startDate, end: now },
      exerciseTypes: [],
      hasRealActivity: true, // Only show sessions with real activity
    };

    return dataManager.getSessions(filters);
  };

  const handleDataPointPress = (dataPoint: ChartDataPoint) => {
    if (dataPoint.metadata?.sessionId) {
      const session = dataManager.getSessions().find(s => s.id === dataPoint.metadata.sessionId);
      if (session) {
        onSessionPress?.(session);
      }
    } else {
      Alert.alert('Data Point', `Value: ${dataPoint.y}\nLabel: ${dataPoint.label || 'N/A'}`);
    }
  };

  const renderStatsCards = () => {
    if (!dashboardData) return null;

    const stats = [
      {
        title: 'Total Sessions',
        value: dashboardData.totalSessions.toString(),
        icon: 'fitness',
        color: '#007AFF',
      },
      {
        title: 'Total Reps',
        value: dashboardData.totalReps.toString(),
        icon: 'repeat',
        color: '#34C759',
      },
      {
        title: 'Calories Burned',
        value: dashboardData.totalCalories.toString(),
        icon: 'flame',
        color: '#FF9500',
      },
      {
        title: 'Current Streak',
        value: `${dashboardData.currentStreak} days`,
        icon: 'trending-up',
        color: '#AF52DE',
      },
    ];

    return (
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { borderLeftColor: stat.color }]}>
            <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderWeeklyProgressChart = () => {
    if (!dashboardData) return null;

    const chartConfig = {
      type: 'line' as const,
      title: 'Weekly Progress',
      xAxisLabel: 'Day',
      yAxisLabel: 'Reps',
      data: dashboardData.weeklyProgress.map((point, index) => ({
        ...point,
        metadata: { sessionId: `week_${index}` },
      })),
    };

    return (
      <ChartContainer
        config={chartConfig}
        onDataPointPress={handleDataPointPress}
        height={250}
      />
    );
  };

  const renderExerciseComparisonChart = () => {
    if (!dashboardData) return null;

    const chartConfig = {
      type: 'bar' as const,
      title: 'Exercise Comparison',
      xAxisLabel: 'Exercise',
      yAxisLabel: 'Average Reps',
      data: dashboardData.exerciseComparison,
    };

    return (
      <ChartContainer
        config={chartConfig}
        onDataPointPress={handleDataPointPress}
        height={250}
      />
    );
  };

  const renderGoalProgressGauges = () => {
    if (!dashboardData || dashboardData.goalProgress.length === 0) return null;

    return (
      <View style={styles.goalsContainer}>
        <Text style={styles.sectionTitle}>Goal Progress</Text>
        <View style={styles.goalsGrid}>
          {dashboardData.goalProgress.map((goal, index) => {
            const chartConfig = {
              type: 'gauge' as const,
              title: goal.exerciseName,
              xAxisLabel: '',
              yAxisLabel: '',
              data: [{
                x: 'progress',
                y: goal.percentage,
                label: `${goal.current}/${goal.target} reps`,
                color: goal.status === 'on-track' ? '#34C759' : '#FF3B30',
              }],
            };

            return (
              <View key={index} style={styles.goalCard}>
                <ChartContainer
                  config={chartConfig}
                  onDataPointPress={handleDataPointPress}
                  height={150}
                />
                <Text style={styles.goalStatus}>
                  {goal.status === 'on-track' ? 'On Track' : 'Off Track'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderScatterPlot = () => {
    const sessions = getFilteredData();
    if (sessions.length === 0) return null;

    // Create scatter plot: reps vs calories
    const scatterData = sessions.map(session => ({
      x: session.reps,
      y: session.calories,
      label: `${session.exerciseName}: ${session.reps} reps`,
      color: session.aiMetrics.accuracy > 80 ? '#34C759' : '#FF3B30',
      metadata: { sessionId: session.id },
    }));

    const chartConfig = {
      type: 'scatter' as const,
      title: 'Reps vs Calories',
      xAxisLabel: 'Reps',
      yAxisLabel: 'Calories',
      data: scatterData,
    };

    return (
      <ChartContainer
        config={chartConfig}
        onDataPointPress={handleDataPointPress}
        height={250}
      />
    );
  };

  const renderBubbleChart = () => {
    const sessions = getFilteredData();
    if (sessions.length === 0) return null;

    // Create bubble chart: reps vs accuracy, bubble size = calories
    const bubbleData = sessions.map(session => ({
      x: session.reps,
      y: session.aiMetrics.accuracy,
      label: `${session.exerciseName}`,
      color: session.hasRealActivity ? '#007AFF' : '#FF3B30',
      metadata: { 
        sessionId: session.id,
        size: Math.max(5, session.calories / 10), // Bubble size based on calories
      },
    }));

    const chartConfig = {
      type: 'bubble' as const,
      title: 'Reps vs Accuracy (Bubble = Calories)',
      xAxisLabel: 'Reps',
      yAxisLabel: 'Accuracy %',
      data: bubbleData,
    };

    return (
      <ChartContainer
        config={chartConfig}
        onDataPointPress={handleDataPointPress}
        height={250}
      />
    );
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {[
        { key: 'all', label: 'All Time' },
        { key: 'week', label: 'This Week' },
        { key: 'month', label: 'This Month' },
      ].map(filter => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            selectedFilter === filter.key && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter(filter.key as any)}
        >
          <Text
            style={[
              styles.filterButtonText,
              selectedFilter === filter.key && styles.filterButtonTextActive,
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChartToggle = () => (
    <View style={styles.chartToggleContainer}>
      <Text style={styles.sectionTitle}>Chart Types</Text>
      <View style={styles.chartToggleButtons}>
        {[
          { key: 'line', label: 'Line', icon: 'trending-up' },
          { key: 'bar', label: 'Bar', icon: 'bar-chart' },
          { key: 'scatter', label: 'Scatter', icon: 'radio-button-off' },
          { key: 'bubble', label: 'Bubble', icon: 'radio-button-on' },
        ].map(chart => (
          <TouchableOpacity
            key={chart.key}
            style={[
              styles.chartToggleButton,
              selectedChart === chart.key && styles.chartToggleButtonActive,
            ]}
            onPress={() => setSelectedChart(selectedChart === chart.key ? null : chart.key)}
          >
            <Ionicons
              name={chart.icon as any}
              size={16}
              color={selectedChart === chart.key ? '#007AFF' : '#666'}
            />
            <Text
              style={[
                styles.chartToggleText,
                selectedChart === chart.key && styles.chartToggleTextActive,
              ]}
            >
              {chart.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (!dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.headerTitle}>Fitness Dashboard</Text>
      
      {renderFilterButtons()}
      {renderStatsCards()}
      
      <Text style={styles.sectionTitle}>Progress Tracking</Text>
      {renderWeeklyProgressChart()}
      
      <Text style={styles.sectionTitle}>Exercise Analysis</Text>
      {renderExerciseComparisonChart()}
      
      {renderGoalProgressGauges()}
      
      {renderChartToggle()}
      
      {selectedChart === 'scatter' && renderScatterPlot()}
      {selectedChart === 'bubble' && renderBubbleChart()}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Only sessions with real activity are included in analysis
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginHorizontal: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginVertical: 16,
  },
  goalsContainer: {
    marginBottom: 20,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  goalCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
  },
  goalStatus: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  chartToggleContainer: {
    marginBottom: 20,
  },
  chartToggleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  chartToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    margin: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartToggleButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  chartToggleText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  chartToggleTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
