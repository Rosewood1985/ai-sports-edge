import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/Colors';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

// Define time period types
export type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

interface DateRangeSelectorProps {
  selectedPeriod: string;
  onSelectPeriod: (period: TimePeriod) => void;
  onSelectCustomRange?: (start: Date, end: Date) => void;
  customDateRange?: { start: Date; end: Date } | null;
}

/**
 * DateRangeSelector component for selecting time periods or custom date ranges
 */
const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selectedPeriod,
  onSelectPeriod,
  onSelectCustomRange,
  customDateRange,
}) => {
  // State
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState<any>({});
  
  // Get theme colors
  const { colors, isDark } = useTheme();
  const backgroundColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  
  // Time period options
  const periods = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'Last 7 Days' },
    { key: 'month', label: 'Last 30 Days' },
    { key: 'quarter', label: 'Last 90 Days' },
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'last_quarter', label: 'Last 3 Months' },
    { key: 'half_year', label: 'Last 6 Months' },
    { key: 'ytd', label: 'Year to Date' },
    { key: 'year', label: 'Last Year' },
  ];
  
  // Show calendar modal
  const showCalendar = () => {
    // Reset selection
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setMarkedDates({});
    setIsCalendarVisible(true);
  };
  
  // Hide calendar modal
  const hideCalendar = () => {
    setIsCalendarVisible(false);
  };
  
  // Handle date selection
  const handleDateSelect = (day: any) => {
    const dateString = day.dateString;
    
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Start new selection
      setSelectedStartDate(dateString);
      setSelectedEndDate(null);
      setMarkedDates({
        [dateString]: {
          selected: true,
          startingDay: true,
          color: Colors.neon.blue,
          textColor: 'white',
        },
      });
    } else {
      // Complete the selection
      const start = new Date(selectedStartDate);
      const end = new Date(dateString);
      
      // Ensure start date is before end date
      if (start > end) {
        setSelectedStartDate(dateString);
        setSelectedEndDate(selectedStartDate);
      } else {
        setSelectedEndDate(dateString);
      }
      
      // Mark the range
      const markedDatesObj: any = {};
      const startDate = start < end ? start : end;
      const endDate = start < end ? end : start;
      
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        if (dateStr === startDate.toISOString().split('T')[0]) {
          markedDatesObj[dateStr] = {
            selected: true,
            startingDay: true,
            color: Colors.neon.blue,
            textColor: 'white',
          };
        } else if (dateStr === endDate.toISOString().split('T')[0]) {
          markedDatesObj[dateStr] = {
            selected: true,
            endingDay: true,
            color: Colors.neon.blue,
            textColor: 'white',
          };
        } else {
          markedDatesObj[dateStr] = {
            selected: true,
            color: `${Colors.neon.blue}50`,
            textColor: 'white',
          };
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setMarkedDates(markedDatesObj);
    }
  };
  
  // Apply selected date range
  const applyDateRange = () => {
    if (selectedStartDate && selectedEndDate && onSelectCustomRange) {
      const start = new Date(selectedStartDate);
      const end = new Date(selectedEndDate);
      
      // Ensure start date is before end date
      if (start > end) {
        onSelectCustomRange(end, start);
      } else {
        onSelectCustomRange(start, end);
      }
      
      hideCalendar();
    }
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Get custom range display text
  const getCustomRangeText = () => {
    if (customDateRange) {
      return `${formatDate(customDateRange.start)} - ${formatDate(customDateRange.end)}`;
    }
    return 'Custom Range';
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.periodSelector}
        contentContainerStyle={styles.periodSelectorContent}
      >
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodOption,
              selectedPeriod === period.key && styles.selectedPeriod,
              { backgroundColor },
            ]}
            onPress={() => onSelectPeriod(period.key as TimePeriod)}
          >
            <Text
              style={[
                styles.periodText,
                { color: textColor },
                selectedPeriod === period.key && styles.selectedPeriodText,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          style={[
            styles.periodOption,
            selectedPeriod === 'custom' && styles.selectedPeriod,
            { backgroundColor },
          ]}
          onPress={showCalendar}
        >
          <Text
            style={[
              styles.periodText,
              { color: textColor },
              selectedPeriod === 'custom' && styles.selectedPeriodText,
            ]}
          >
            {selectedPeriod === 'custom' ? getCustomRangeText() : 'Custom Range'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      <Modal
        visible={isCalendarVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={hideCalendar}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <ThemedText style={styles.calendarTitle}>Select Date Range</ThemedText>
              <TouchableOpacity onPress={hideCalendar}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            <Calendar
              markingType="period"
              markedDates={markedDates}
              onDayPress={handleDateSelect}
              theme={{
                calendarBackground: backgroundColor,
                textSectionTitleColor: textColor,
                selectedDayBackgroundColor: Colors.neon.blue,
                selectedDayTextColor: '#ffffff',
                todayTextColor: Colors.neon.blue,
                dayTextColor: textColor,
                textDisabledColor: '#d9e1e8',
                dotColor: Colors.neon.blue,
                selectedDotColor: '#ffffff',
                arrowColor: Colors.neon.blue,
                monthTextColor: textColor,
                indicatorColor: Colors.neon.blue,
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 16,
              }}
            />
            
            <View style={styles.calendarFooter}>
              <TouchableOpacity
                style={[styles.calendarButton, styles.cancelButton]}
                onPress={hideCalendar}
              >
                <Text style={styles.calendarButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.calendarButton,
                  styles.applyButton,
                  (!selectedStartDate || !selectedEndDate) && styles.disabledButton,
                ]}
                onPress={applyDateRange}
                disabled={!selectedStartDate || !selectedEndDate}
              >
                <Text style={styles.calendarButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  periodSelector: {
    maxHeight: 50,
  },
  periodSelectorContent: {
    paddingHorizontal: 16,
  },
  periodOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedPeriod: {
    backgroundColor: Colors.neon.blue,
  },
  periodText: {
    fontSize: 14,
  },
  selectedPeriodText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    width: '90%',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  calendarButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  applyButton: {
    backgroundColor: Colors.neon.blue,
  },
  disabledButton: {
    opacity: 0.5,
  },
  calendarButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default DateRangeSelector;