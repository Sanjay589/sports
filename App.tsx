import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CameraScreen from './CameraScreen';
import Dashboard from './components/Dashboard';
import { ExerciseSession } from './types/ExerciseData';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedTestType, setSelectedTestType] = useState('');
  const [stats, setStats] = useState({
    totalTests: 12,
    averageScore: 85,
    bestScore: 95,
    recentActivity: [
      { test: 'Sit-ups', score: 88, date: '2024-01-15', accuracy: 92 },
      { test: 'Vertical Jump', score: 92, date: '2024-01-14', accuracy: 89 },
      { test: 'Shuttle Run', score: 78, date: '2024-01-13', accuracy: 85 }
    ]
  });

  const [cameraSettings, setCameraSettings] = useState({
    quality: 'high',
    resolution: '1080p',
    frameRate: 30,
    accuracy: 95
  });

  const handleStartTest = () => {
    setCurrentScreen('test-selection');
  };

  const handleCameraTest = (testType) => {
    setSelectedTestType(testType);
    setCurrentScreen('camera');
  };

  const handleProfile = () => {
    setCurrentScreen('profile');
  };

  const handleLeaderboard = () => {
    setCurrentScreen('leaderboard');
  };

  const handleAnalytics = () => {
    setCurrentScreen('analytics');
  };

  const handleSessionPress = (session: ExerciseSession) => {
    Alert.alert(
      'Session Details',
      `Exercise: ${session.exerciseName}\nReps: ${session.reps}\nDuration: ${session.duration}s\nAccuracy: ${session.aiMetrics.accuracy}%\nReal Activity: ${session.hasRealActivity ? 'Yes' : 'No'}`
    );
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const calculateCameraQuality = () => {
    // Simulate camera quality detection based on device capabilities
    const devicePixelRatio = Dimensions.get('window').scale;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    let quality = 'medium';
    let resolution = '720p';
    let frameRate = 24;
    let accuracy = 80;

    if (devicePixelRatio >= 3 && screenWidth >= 400) {
      quality = 'ultra';
      resolution = '4K';
      frameRate = 60;
      accuracy = 98;
    } else if (devicePixelRatio >= 2 && screenWidth >= 350) {
      quality = 'high';
      resolution = '1080p';
      frameRate = 30;
      accuracy = 92;
    } else if (screenWidth >= 300) {
      quality = 'medium';
      resolution = '720p';
      frameRate = 24;
      accuracy = 85;
    } else {
      quality = 'low';
      resolution = '480p';
      frameRate = 20;
      accuracy = 75;
    }

    setCameraSettings({ quality, resolution, frameRate, accuracy });
    return { quality, resolution, frameRate, accuracy };
  };

  const renderHomeScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sports App</Text>
        <Text style={styles.subtitle}>Welcome to your fitness journey!</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="fitness" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{stats.totalTests}</Text>
            <Text style={styles.statLabel}>Total Tests</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{stats.averageScore}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trophy" size={24} color="#FF9500" />
            <Text style={styles.statNumber}>{stats.bestScore}%</Text>
            <Text style={styles.statLabel}>Best Score</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startTestButton} onPress={handleStartTest}>
          <Ionicons name="play-circle" size={32} color="white" />
          <Text style={styles.startTestText}>Start New Test</Text>
        </TouchableOpacity>

        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          {stats.recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="fitness" size={20} color="#007AFF" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTest}>{activity.test}</Text>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
              <View style={styles.activityScore}>
                <Text style={styles.scoreText}>{activity.score}%</Text>
                <Text style={styles.accuracyText}>Acc: {activity.accuracy}%</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleLeaderboard}>
              <Ionicons name="podium" size={24} color="#FF9500" />
              <Text style={styles.actionText}>Leaderboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleProfile}>
              <Ionicons name="person" size={24} color="#007AFF" />
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => handleCameraTest('Quick Test')}>
              <Ionicons name="camera" size={24} color="#34C759" />
              <Text style={styles.actionText}>Record</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleAnalytics}>
              <Ionicons name="analytics" size={24} color="#AF52DE" />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderTestSelection = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Select Test Type</Text>
        <Text style={styles.subtitle}>Choose your fitness test</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.testCard} 
          onPress={() => handleCameraTest('Sit-ups')}
        >
          <Ionicons name="fitness" size={40} color="#007AFF" />
          <Text style={styles.testTitle}>Sit-ups</Text>
          <Text style={styles.testDescription}>Test your core strength and endurance</Text>
          <Text style={styles.testAccuracy}>Accuracy: {cameraSettings.accuracy}%</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testCard} 
          onPress={() => handleCameraTest('Push-ups')}
        >
          <Ionicons name="body" size={40} color="#34C759" />
          <Text style={styles.testTitle}>Push-ups</Text>
          <Text style={styles.testDescription}>Measure upper body strength</Text>
          <Text style={styles.testAccuracy}>Accuracy: {cameraSettings.accuracy}%</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testCard} 
          onPress={() => handleCameraTest('Vertical Jump')}
        >
          <Ionicons name="arrow-up" size={40} color="#FF9500" />
          <Text style={styles.testTitle}>Vertical Jump</Text>
          <Text style={styles.testDescription}>Test explosive leg power</Text>
          <Text style={styles.testAccuracy}>Accuracy: {cameraSettings.accuracy}%</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testCard} 
          onPress={() => handleCameraTest('Plank Hold')}
        >
          <Ionicons name="time" size={40} color="#AF52DE" />
          <Text style={styles.testTitle}>Plank Hold</Text>
          <Text style={styles.testDescription}>Core stability and endurance</Text>
          <Text style={styles.testAccuracy}>Accuracy: {cameraSettings.accuracy}%</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderCameraScreen = () => (
    <CameraScreen 
      onBack={handleBackToHome} 
      testType={selectedTestType} 
    />
  );

  const renderProfileScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your fitness journey</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <Ionicons name="person-circle" size={80} color="#007AFF" />
          <Text style={styles.profileName}>Athlete</Text>
          <Text style={styles.profileEmail}>athlete@example.com</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={24} color="#FF9500" />
            <Text style={styles.statNumber}>15</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#34C759" />
            <Text style={styles.statNumber}>30</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color="#AF52DE" />
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderLeaderboardScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top performers</Text>
      </View>

      <View style={styles.content}>
        {[1, 2, 3, 4, 5].map((rank) => (
          <View key={rank} style={styles.leaderboardItem}>
            <Text style={styles.rankNumber}>#{rank}</Text>
            <Ionicons name="person-circle" size={40} color="#007AFF" />
            <View style={styles.leaderboardInfo}>
              <Text style={styles.leaderboardName}>Player {rank}</Text>
              <Text style={styles.leaderboardScore}>{95 - rank * 2}%</Text>
            </View>
            <Ionicons name="trophy" size={24} color="#FF9500" />
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderAnalyticsScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>Comprehensive fitness insights</Text>
      </View>

      <Dashboard onSessionPress={handleSessionPress} />
    </View>
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'test-selection':
        return renderTestSelection();
      case 'camera':
        return renderCameraScreen();
      case 'profile':
        return renderProfileScreen();
      case 'leaderboard':
        return renderLeaderboardScreen();
      case 'analytics':
        return renderAnalyticsScreen();
      default:
        return renderHomeScreen();
    }
  };

  return (
    <>
      {renderCurrentScreen()}
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    padding: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: -15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 5,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  startTestButton: {
    backgroundColor: '#34C759',
    borderRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  startTestText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  activitySection: {
    backgroundColor: 'white',
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTest: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  activityScore: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  accuracyText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quickActions: {
    marginBottom: 30,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  testCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  testTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  testAccuracy: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 5,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    padding: 20,
  },
  cameraPreview: {
    height: 300,
    backgroundColor: '#000',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  cameraInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  recordText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  settingsButton: {
    backgroundColor: 'white',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  settingsText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  profileCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  leaderboardItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9500',
    marginRight: 15,
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 15,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  leaderboardScore: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  analyticsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  qualityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});