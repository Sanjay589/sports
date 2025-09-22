// Chart container component with multiple chart types
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ChartDataPoint, ChartConfig } from '../../types/ExerciseData';

const { width } = Dimensions.get('window');

interface ChartContainerProps {
  config: ChartConfig;
  onDataPointPress?: (dataPoint: ChartDataPoint) => void;
  height?: number;
}

export default function ChartContainer({ config, onDataPointPress, height = 300 }: ChartContainerProps) {
  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'gauge':
        return renderGaugeChart();
      case 'scatter':
        return renderScatterChart();
      case 'bubble':
        return renderBubbleChart();
      default:
        return renderBarChart();
    }
  };

  const renderBarChart = () => {
    const maxValue = Math.max(...config.data.map(d => d.y));
    const barWidth = (width - 60) / config.data.length;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.barChart}>
          {config.data.map((dataPoint, index) => (
            <TouchableOpacity
              key={index}
              style={styles.barContainer}
              onPress={() => onDataPointPress?.(dataPoint)}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: (dataPoint.y / maxValue) * (height - 80),
                    backgroundColor: dataPoint.color || '#007AFF',
                    width: barWidth - 4,
                  }
                ]}
              />
              <Text style={styles.barLabel}>{dataPoint.x}</Text>
              <Text style={styles.barValue}>{dataPoint.y}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.yAxis}>
          {[0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue].map((value, index) => (
            <Text key={index} style={styles.yAxisLabel}>
              {Math.round(value)}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderLineChart = () => {
    const maxValue = Math.max(...config.data.map(d => d.y));
    const minValue = Math.min(...config.data.map(d => d.y));
    const range = maxValue - minValue || 1;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.lineChart}>
          <View style={styles.lineContainer}>
            {config.data.map((dataPoint, index) => {
              if (index === 0) return null;
              const prevPoint = config.data[index - 1];
              const x1 = ((index - 1) / (config.data.length - 1)) * (width - 60);
              const y1 = ((maxValue - prevPoint.y) / range) * (height - 80) + 20;
              const x2 = (index / (config.data.length - 1)) * (width - 60);
              const y2 = ((maxValue - dataPoint.y) / range) * (height - 80) + 20;

              return (
                <View
                  key={index}
                  style={[
                    styles.line,
                    {
                      left: x1,
                      top: y1,
                      width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
                      transform: [
                        {
                          rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad`
                        }
                      ],
                      backgroundColor: dataPoint.color || '#007AFF',
                    }
                  ]}
                />
              );
            })}
          </View>
          {config.data.map((dataPoint, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.linePoint,
                {
                  left: (index / (config.data.length - 1)) * (width - 60),
                  top: ((maxValue - dataPoint.y) / range) * (height - 80) + 15,
                  backgroundColor: dataPoint.color || '#007AFF',
                }
              ]}
              onPress={() => onDataPointPress?.(dataPoint)}
            />
          ))}
        </View>
        <View style={styles.xAxis}>
          {config.data.map((dataPoint, index) => (
            <Text key={index} style={styles.xAxisLabel}>
              {dataPoint.x}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const renderGaugeChart = () => {
    const dataPoint = config.data[0];
    const percentage = Math.min(100, Math.max(0, dataPoint.y));
    const isOnTrack = percentage >= 80;
    const angle = (percentage / 100) * 180; // 0-180 degrees

    return (
      <View style={styles.gaugeContainer}>
        <View style={styles.gauge}>
          <View style={styles.gaugeBackground} />
          <View
            style={[
              styles.gaugeFill,
              {
                transform: [{ rotate: `${angle - 90}deg` }],
                backgroundColor: isOnTrack ? '#34C759' : '#FF3B30',
              }
            ]}
          />
          <View style={styles.gaugeCenter}>
            <Text style={styles.gaugeValue}>{Math.round(percentage)}%</Text>
            <Text style={styles.gaugeLabel}>{dataPoint.label || 'Progress'}</Text>
          </View>
        </View>
        <View style={styles.gaugeLabels}>
          <Text style={[styles.gaugeLabelText, { color: '#FF3B30' }]}>0%</Text>
          <Text style={[styles.gaugeLabelText, { color: isOnTrack ? '#34C759' : '#FF3B30' }]}>
            {Math.round(percentage)}%
          </Text>
          <Text style={[styles.gaugeLabelText, { color: '#34C759' }]}>100%</Text>
        </View>
      </View>
    );
  };

  const renderScatterChart = () => {
    const maxX = Math.max(...config.data.map(d => typeof d.x === 'number' ? d.x : 0));
    const maxY = Math.max(...config.data.map(d => d.y));
    const minX = Math.min(...config.data.map(d => typeof d.x === 'number' ? d.x : 0));
    const minY = Math.min(...config.data.map(d => d.y));

    return (
      <View style={styles.chartContainer}>
        <View style={styles.scatterChart}>
          {config.data.map((dataPoint, index) => {
            const x = typeof dataPoint.x === 'number' ? dataPoint.x : 0;
            const normalizedX = ((x - minX) / (maxX - minX || 1)) * (width - 60);
            const normalizedY = ((dataPoint.y - minY) / (maxY - minY || 1)) * (height - 80);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.scatterPoint,
                  {
                    left: normalizedX,
                    top: normalizedY,
                    backgroundColor: dataPoint.color || '#007AFF',
                  }
                ]}
                onPress={() => onDataPointPress?.(dataPoint)}
              />
            );
          })}
        </View>
        <View style={styles.scatterLabels}>
          <Text style={styles.scatterLabel}>X: {config.xAxisLabel}</Text>
          <Text style={styles.scatterLabel}>Y: {config.yAxisLabel}</Text>
        </View>
      </View>
    );
  };

  const renderBubbleChart = () => {
    const maxX = Math.max(...config.data.map(d => typeof d.x === 'number' ? d.x : 0));
    const maxY = Math.max(...config.data.map(d => d.y));
    const maxSize = Math.max(...config.data.map(d => d.metadata?.size || 1));

    return (
      <View style={styles.chartContainer}>
        <View style={styles.bubbleChart}>
          {config.data.map((dataPoint, index) => {
            const x = typeof dataPoint.x === 'number' ? dataPoint.x : 0;
            const normalizedX = (x / maxX) * (width - 60);
            const normalizedY = (dataPoint.y / maxY) * (height - 80);
            const size = ((dataPoint.metadata?.size || 1) / maxSize) * 30 + 10;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.bubblePoint,
                  {
                    left: normalizedX - size / 2,
                    top: normalizedY - size / 2,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: dataPoint.color || '#007AFF',
                    opacity: 0.7,
                  }
                ]}
                onPress={() => onDataPointPress?.(dataPoint)}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { height }]}>
      <Text style={styles.title}>{config.title}</Text>
      {renderChart()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    flex: 1,
    position: 'relative',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  barValue: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  yAxis: {
    position: 'absolute',
    left: -30,
    top: 0,
    height: '100%',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#666',
  },
  lineChart: {
    flex: 1,
    position: 'relative',
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  line: {
    position: 'absolute',
    height: 2,
  },
  linePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  gauge: {
    width: 200,
    height: 100,
    position: 'relative',
  },
  gaugeBackground: {
    position: 'absolute',
    width: 200,
    height: 100,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    borderWidth: 20,
    borderColor: '#E5E5E7',
    borderBottomWidth: 0,
  },
  gaugeFill: {
    position: 'absolute',
    width: 200,
    height: 100,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    borderWidth: 20,
    borderBottomWidth: 0,
    transformOrigin: 'center bottom',
  },
  gaugeCenter: {
    position: 'absolute',
    top: 50,
    left: 50,
    alignItems: 'center',
    transform: [{ translateX: -50 }, { translateY: -20 }],
  },
  gaugeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  gaugeLabel: {
    fontSize: 12,
    color: '#666',
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginTop: 10,
  },
  gaugeLabelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scatterChart: {
    flex: 1,
    position: 'relative',
  },
  scatterPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scatterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  scatterLabel: {
    fontSize: 12,
    color: '#666',
  },
  bubbleChart: {
    flex: 1,
    position: 'relative',
  },
  bubblePoint: {
    position: 'absolute',
  },
});
