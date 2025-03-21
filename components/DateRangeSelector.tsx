import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';
import { TimePeriodFilter } from '../services/bettingAnalyticsService';

// Import DateTimePicker conditionally to avoid TypeScript errors
let DateTimePicker: any;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
  console.warn('DateTimePicker not available, using fallback');
  // Fallback implementation if the module is not available
  DateTimePicker = ({ value, onChange }: any) => (
    <ThemedText>Date picker not available</ThemedText>
  );
}

/**
 * Date range selector props
 */
interface DateRangeSelectorProps {
  timePeriod: TimePeriodFilter['period'] | 'custom';
  startDate?: Date;
  endDate?: Date;
  onSelectPeriod: (period: TimePeriodFilter['period'] | 'custom') => void;
  onSelectCustomRange: (startDate: Date, endDate: Date) => void;
}

/**
 * Component for selecting date ranges for analytics
 */
const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  timePeriod,
  startDate,
  endDate,
  onSelectPeriod,
  onSelectCustomRange
}) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate || new Date());
  const [tempEndDate, setTempEndDate] = useState(endDate || new Date());
  const [showCustomModal, setShowCustomModal] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = '#0a7ea4';
  
  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  /**
   * Handle period button press
   */
  const handlePeriodPress = (period: TimePeriodFilter['period'] | 'custom') => {
    if (period === 'custom') {
      setShowCustomModal(true);
    } else {
      onSelectPeriod(period);
    }
  };
  
  /**
   * Handle start date change
   */
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      setTempStartDate(selectedDate);
      
      // Ensure end date is not before start date
      if (tempEndDate < selectedDate) {
        setTempEndDate(selectedDate);
      }
    }
  };
  
  /**
   * Handle end date change
   */
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      // Ensure end date is not before start date
      if (selectedDate >= tempStartDate) {
        setTempEndDate(selectedDate);
      }
    }
  };
  
  /**
   * Apply custom date range
   */
  const applyCustomRange = () => {
    onSelectCustomRange(tempStartDate, tempEndDate);
    onSelectPeriod('custom');
    setShowCustomModal(false);
  };
  
  /**
   * Get period button style
   */
  const getPeriodButtonStyle = (period: TimePeriodFilter['period'] | 'custom') => {
    return [
      styles.periodButton,
      timePeriod === period ? styles.activePeriodButton : null
    ];
  };
  
  /**
   * Get period button text style
   */
  const getPeriodButtonTextStyle = (period: TimePeriodFilter['period'] | 'custom') => {
    return [
      styles.periodButtonText,
      timePeriod === period ? styles.activePeriodButtonText : null
    ];
  };
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Time Period</ThemedText>
      
      <View style={styles.periodButtonsContainer}>
        <TouchableOpacity
          style={getPeriodButtonStyle('today')}
          onPress={() => handlePeriodPress('today')}
        >
          <ThemedText style={getPeriodButtonTextStyle('today')}>Today</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={getPeriodButtonStyle('week')}
          onPress={() => handlePeriodPress('week')}
        >
          <ThemedText style={getPeriodButtonTextStyle('week')}>Week</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={getPeriodButtonStyle('month')}
          onPress={() => handlePeriodPress('month')}
        >
          <ThemedText style={getPeriodButtonTextStyle('month')}>Month</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={getPeriodButtonStyle('year')}
          onPress={() => handlePeriodPress('year')}
        >
          <ThemedText style={getPeriodButtonTextStyle('year')}>Year</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={getPeriodButtonStyle('all')}
          onPress={() => handlePeriodPress('all')}
        >
          <ThemedText style={getPeriodButtonTextStyle('all')}>All</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={getPeriodButtonStyle('custom')}
          onPress={() => handlePeriodPress('custom')}
        >
          <ThemedText style={getPeriodButtonTextStyle('custom')}>Custom</ThemedText>
        </TouchableOpacity>
      </View>
      
      {timePeriod === 'custom' && startDate && endDate && (
        <ThemedView style={styles.customRangeInfo}>
          <ThemedText style={styles.customRangeText}>
            {formatDate(startDate)} - {formatDate(endDate)}
          </ThemedText>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setShowCustomModal(true)}
          >
            <Ionicons name="pencil" size={16} color={primaryColor} />
          </TouchableOpacity>
        </ThemedView>
      )}
      
      {/* Custom Date Range Modal */}
      <Modal
        visible={showCustomModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Select Date Range</ThemedText>
            
            <View style={styles.datePickerContainer}>
              <ThemedText style={styles.datePickerLabel}>Start Date</ThemedText>
              
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowStartPicker(true)}
              >
                <ThemedText style={styles.dateText}>
                  {formatDate(tempStartDate)}
                </ThemedText>
                <Ionicons name="calendar" size={20} color={primaryColor} />
              </TouchableOpacity>
              
              {showStartPicker && (
                <DateTimePicker
                  value={tempStartDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleStartDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
            
            <View style={styles.datePickerContainer}>
              <ThemedText style={styles.datePickerLabel}>End Date</ThemedText>
              
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowEndPicker(true)}
              >
                <ThemedText style={styles.dateText}>
                  {formatDate(tempEndDate)}
                </ThemedText>
                <Ionicons name="calendar" size={20} color={primaryColor} />
              </TouchableOpacity>
              
              {showEndPicker && (
                <DateTimePicker
                  value={tempEndDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleEndDateChange}
                  minimumDate={tempStartDate}
                  maximumDate={new Date()}
                />
              )}
            </View>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCustomModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyCustomRange}
              >
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  periodButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  periodButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  activePeriodButton: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  periodButtonText: {
    fontSize: 14,
  },
  activePeriodButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  customRangeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  customRangeText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  editButton: {
    marginLeft: 8,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  datePickerLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 16,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
  },
  applyButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DateRangeSelector;