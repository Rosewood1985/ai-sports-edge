import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { bettingAnalyticsService, BetRecord, TimePeriodFilter } from './bettingAnalyticsService';
import { analyticsService } from './analyticsService';

// Import types for expo-sharing and expo-document-picker
// These need to be installed with:
// npm install expo-sharing expo-document-picker
let Sharing: any;
let DocumentPicker: any;

// For web compatibility
declare const window: any;
declare const alert: (message: string) => void;

// Dynamically import modules that might not be available in all environments
if (Platform.OS !== 'web') {
  try {
    // Use require instead of dynamic import for better TypeScript compatibility
    Sharing = require('expo-sharing');
    DocumentPicker = require('expo-document-picker');
  } catch (err) {
    console.error('Error loading sharing modules:', err);
  }
}

/**
 * Export format options
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv'
}

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  timePeriod?: TimePeriodFilter;
  includePersonalInfo?: boolean;
}

/**
 * Service for exporting and importing data
 */
class DataExportService {
  /**
   * Export betting history data
   * @param options Export options
   * @returns Promise with the export file path or URL
   */
  async exportBettingHistory(options: ExportOptions): Promise<string> {
    try {
      // Track analytics event
      analyticsService.trackEvent('export_betting_history', {
        format: options.format,
        timePeriod: options.timePeriod?.period || 'all'
      });
      
      // Get betting history data
      const bets = await bettingAnalyticsService.getUserBets({
        timePeriod: options.timePeriod
      });
      
      if (bets.length === 0) {
        throw new Error('No betting history data to export');
      }
      
      // Process data based on options
      const processedData = this.processBetsForExport(bets, options.includePersonalInfo);
      
      // Convert data to the requested format
      let content: string;
      let fileExtension: string;
      
      switch (options.format) {
        case ExportFormat.JSON:
          content = JSON.stringify(processedData, null, 2);
          fileExtension = 'json';
          break;
        case ExportFormat.CSV:
          content = this.convertToCSV(processedData);
          fileExtension = 'csv';
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `betting-history-${timestamp}.${fileExtension}`;
      
      // Save and share the file
      return await this.saveAndShareFile(content, filename, options.format);
    } catch (error) {
      console.error('Error exporting betting history:', error);
      analyticsService.trackError(error as Error, { method: 'exportBettingHistory' });
      throw error;
    }
  }
  
  /**
   * Process bets for export, optionally removing personal information
   * @param bets Bet records
   * @param includePersonalInfo Whether to include personal information
   * @returns Processed bet records
   */
  private processBetsForExport(bets: BetRecord[], includePersonalInfo = false): any[] {
    return bets.map(bet => {
      // Create a new object instead of modifying the original
      const exportBet: Record<string, any> = {};
      
      // Copy all properties except personal information if not included
      Object.keys(bet).forEach(key => {
        if (includePersonalInfo || (key !== 'userId' && key !== 'notes' && key !== 'tags')) {
          exportBet[key] = bet[key as keyof BetRecord];
        }
      });
      
      // Convert timestamps to ISO strings for better readability
      if (exportBet.createdAt && typeof exportBet.createdAt.toMillis === 'function') {
        exportBet.createdAt = new Date(exportBet.createdAt.toMillis()).toISOString();
      }
      
      if (exportBet.settledAt && typeof exportBet.settledAt.toMillis === 'function') {
        exportBet.settledAt = new Date(exportBet.settledAt.toMillis()).toISOString();
      }
      
      if (exportBet.gameDate && typeof exportBet.gameDate.toMillis === 'function') {
        exportBet.gameDate = new Date(exportBet.gameDate.toMillis()).toISOString();
      }
      
      return exportBet;
    });
  }
  
  /**
   * Convert data to CSV format
   * @param data Array of objects to convert
   * @returns CSV string
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) {
      return '';
    }
    
    // Get headers from the first object
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    const headerRow = headers.join(',');
    
    // Create CSV data rows
    const dataRows = data.map(item => {
      return headers.map(header => {
        const value = item[header];
        
        // Handle different value types
        if (value === null || value === undefined) {
          return '';
        } else if (typeof value === 'string') {
          // Escape quotes and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        } else if (typeof value === 'object') {
          // Convert objects to JSON strings
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } else {
          return value;
        }
      }).join(',');
    });
    
    // Combine header and data rows
    return [headerRow, ...dataRows].join('\n');
  }
  
  /**
   * Save and share a file
   * @param content File content
   * @param filename Filename
   * @param format Export format
   * @returns Promise with the file path or URL
   */
  private async saveAndShareFile(content: string, filename: string, format: ExportFormat): Promise<string> {
    try {
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (!isSharingAvailable && Platform.OS !== 'web') {
        throw new Error('Sharing is not available on this device');
      }
      
      if (Platform.OS === 'web') {
        // For web, use a data URI approach which is more compatible with React Native Web
        try {
          // Create a data URI with the content
          const mimeType = format === ExportFormat.JSON ? 'application/json' : 'text/csv';
          const dataUri = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
          
          // Use window.open to trigger download in a new tab
          // This avoids TypeScript errors with document.createElement
          const newWindow = window.open(dataUri);
          if (newWindow) {
            newWindow.opener = null; // Prevent access to parent window
          }
          
          return dataUri;
        } catch (webError) {
          console.error('Error in web download:', webError);
          
          // Fallback to a simple alert with instructions
          alert(`Please copy and save this data manually:\n\n${content.substring(0, 100)}...`);
          
          return 'manual-copy';
        }
      } else {
        // For mobile, save to file system and share
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        
        // Write content to file
        await FileSystem.writeAsStringAsync(fileUri, content);
        
        // Share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: format === ExportFormat.JSON ? 'application/json' : 'text/csv',
          dialogTitle: 'Export Betting History',
          UTI: format === ExportFormat.JSON ? 'public.json' : 'public.comma-separated-values-text'
        });
        
        return fileUri;
      }
    } catch (error) {
      console.error('Error saving and sharing file:', error);
      throw error;
    }
  }
  
  /**
   * Import betting history data
   * @returns Promise with the imported data
   */
  async importBettingHistory(): Promise<BetRecord[]> {
    try {
      // Track analytics event
      analyticsService.trackEvent('import_betting_history', {});
      
      // Pick a document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/csv']
      });
      
      if (result.canceled) {
        throw new Error('Document picking was canceled');
      }
      
      // Read the file content
      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      
      // Parse the content based on file type
      const fileType = result.assets[0].mimeType;
      let importedData: BetRecord[];
      
      if (fileType === 'application/json') {
        importedData = JSON.parse(fileContent);
      } else if (fileType === 'text/csv') {
        importedData = this.parseCSV(fileContent);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      // Validate the imported data
      this.validateImportedData(importedData);
      
      return importedData;
    } catch (error) {
      console.error('Error importing betting history:', error);
      analyticsService.trackError(error as Error, { method: 'importBettingHistory' });
      throw error;
    }
  }
  
  /**
   * Parse CSV data
   * @param csvContent CSV content
   * @returns Parsed data
   */
  private parseCSV(csvContent: string): any[] {
    // Split into rows
    const rows = csvContent.split('\n');
    
    if (rows.length < 2) {
      throw new Error('Invalid CSV format: no data rows');
    }
    
    // Parse header row
    const headers = this.parseCSVRow(rows[0]);
    
    // Parse data rows
    return rows.slice(1).filter(row => row.trim()).map(row => {
      const values = this.parseCSVRow(row);
      
      // Create object from headers and values
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        
        // Try to parse JSON if the value looks like an object or array
        if ((value.startsWith('{') && value.endsWith('}')) || 
            (value.startsWith('[') && value.endsWith(']'))) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Keep as string if parsing fails
          }
        }
        
        obj[header] = value;
      });
      
      return obj;
    });
  }
  
  /**
   * Parse a CSV row, handling quoted values
   * @param row CSV row
   * @returns Array of values
   */
  private parseCSVRow(row: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        // Check for escaped quotes
        if (i + 1 < row.length && row[i + 1] === '"') {
          currentValue += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(currentValue);
        currentValue = '';
      } else {
        // Add character to current value
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue);
    
    return values;
  }
  
  /**
   * Validate imported data
   * @param data Imported data
   */
  private validateImportedData(data: any[]): void {
    if (!Array.isArray(data)) {
      throw new Error('Invalid import data: not an array');
    }
    
    if (data.length === 0) {
      throw new Error('Invalid import data: empty array');
    }
    
    // Check if the data has the required fields
    const requiredFields = ['betType', 'amount', 'odds', 'status'];
    
    for (const item of data) {
      for (const field of requiredFields) {
        if (!(field in item)) {
          throw new Error(`Invalid import data: missing required field '${field}'`);
        }
      }
    }
  }
}

export const dataExportService = new DataExportService();
export default dataExportService;