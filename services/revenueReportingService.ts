/**
 * Revenue Reporting Service
 * 
 * This service provides functions for revenue reporting and analysis.
 */

import db from '../utils/db';
import logger from '../utils/logger';
import cache from '../utils/cache';

// Cache TTL for reports (1 hour)
const REPORT_CACHE_TTL = 60 * 60 * 1000;

// Report types
export enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  TAX = 'tax',
}

// Report status
export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Report interfaces
export interface ReportOptions {
  startDate: Date;
  endDate: Date;
  type: ReportType;
  format?: 'html' | 'json' | 'csv';
  userId?: string;
}

export interface ReportSummary {
  id: string;
  type: ReportType;
  startDate: Date;
  endDate: Date;
  generationDate: Date;
  totalRevenue: number;
  totalTax: number;
  status: ReportStatus;
  reportUrl?: string;
}

export interface CategoryRevenue {
  name: string;
  grossRevenue: number;
  tax: number;
  netRevenue: number;
  percentage: number;
}

export interface DailyRevenue {
  date: Date;
  transactionCount: number;
  grossRevenue: number;
  tax: number;
  netRevenue: number;
}

export interface RevenueReport {
  id: string;
  type: ReportType;
  startDate: Date;
  endDate: Date;
  generationDate: Date;
  totalRevenue: number;
  totalTax: number;
  netRevenue: number;
  transactionCount: number;
  categories: CategoryRevenue[];
  days?: DailyRevenue[];
  comparisonPercentage?: number;
  chartUrl?: string;
}

/**
 * Generate a revenue report
 * 
 * @param options - Report options
 * @returns Generated report
 */
export async function generateReport(options: ReportOptions): Promise<RevenueReport> {
  try {
    const { startDate, endDate, type, format = 'json', userId } = options;
    
    // Validate dates
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }
    
    // Generate cache key
    const cacheKey = `report_${type}_${startDate.toISOString()}_${endDate.toISOString()}_${format}`;
    
    // Check cache
    const cachedReport = cache.get<RevenueReport>(cacheKey);
    if (cachedReport) {
      logger.debug('Using cached report', { type, startDate, endDate });
      return cachedReport;
    }
    
    // Create report record
    const reportRecord = await db.query(
      `INSERT INTO revenue_reports (
        report_type, 
        start_date, 
        end_date, 
        total_revenue, 
        total_tax, 
        status, 
        generated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [type, startDate, endDate, 0, 0, ReportStatus.GENERATING, userId]
    );
    
    const reportId = reportRecord.rows[0].id;
    
    try {
      // Get transactions for the period
      const transactions = await db.query(
        `SELECT 
          t.*,
          c.name as customer_name,
          rc.name as category_name,
          rc.tax_code
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN revenue_categories rc ON t.revenue_category = rc.name
        WHERE t.created_at BETWEEN $1 AND $2
        ORDER BY t.created_at`,
        [startDate, endDate]
      );
      
      // Calculate totals
      let totalRevenue = 0;
      let totalTax = 0;
      let transactionCount = transactions.rows.length;
      
      // Process transactions by category
      const categoriesMap: Record<string, CategoryRevenue> = {};
      
      transactions.rows.forEach((transaction: any) => {
        const amount = parseFloat(transaction.amount) || 0;
        const taxAmount = parseFloat(transaction.tax_amount) || 0;
        const category = transaction.category_name || 'Uncategorized';
        
        totalRevenue += amount;
        totalTax += taxAmount;
        
        if (!categoriesMap[category]) {
          categoriesMap[category] = {
            name: category,
            grossRevenue: 0,
            tax: 0,
            netRevenue: 0,
            percentage: 0,
          };
        }
        
        categoriesMap[category].grossRevenue += amount;
        categoriesMap[category].tax += taxAmount;
        categoriesMap[category].netRevenue += (amount - taxAmount);
      });
      
      // Calculate percentages
      const categories = Object.values(categoriesMap);
      categories.forEach(category => {
        category.percentage = totalRevenue > 0 
          ? Math.round((category.grossRevenue / totalRevenue) * 100) 
          : 0;
      });
      
      // Process transactions by day for daily breakdown
      const daysMap: Record<string, DailyRevenue> = {};
      
      if (type !== ReportType.DAILY) {
        transactions.rows.forEach((transaction: any) => {
          const date = new Date(transaction.created_at);
          const dateString = date.toISOString().split('T')[0];
          const amount = parseFloat(transaction.amount) || 0;
          const taxAmount = parseFloat(transaction.tax_amount) || 0;
          
          if (!daysMap[dateString]) {
            daysMap[dateString] = {
              date: new Date(dateString),
              transactionCount: 0,
              grossRevenue: 0,
              tax: 0,
              netRevenue: 0,
            };
          }
          
          daysMap[dateString].transactionCount += 1;
          daysMap[dateString].grossRevenue += amount;
          daysMap[dateString].tax += taxAmount;
          daysMap[dateString].netRevenue += (amount - taxAmount);
        });
      }
      
      const days = Object.values(daysMap).sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      );
      
      // Get comparison data for previous period
      let comparisonPercentage: number | undefined;
      
      if (type !== ReportType.DAILY) {
        const periodLength = endDate.getTime() - startDate.getTime();
        const previousStartDate = new Date(startDate.getTime() - periodLength);
        const previousEndDate = new Date(endDate.getTime() - periodLength);
        
        const previousPeriod = await db.query(
          `SELECT SUM(amount) as total_revenue
          FROM transactions
          WHERE created_at BETWEEN $1 AND $2`,
          [previousStartDate, previousEndDate]
        );
        
        const previousRevenue = parseFloat(previousPeriod.rows[0]?.total_revenue) || 0;
        
        if (previousRevenue > 0) {
          comparisonPercentage = Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100);
        }
      }
      
      // Create report object
      const report: RevenueReport = {
        id: reportId,
        type,
        startDate,
        endDate,
        generationDate: new Date(),
        totalRevenue,
        totalTax,
        netRevenue: totalRevenue - totalTax,
        transactionCount,
        categories,
        days: type !== ReportType.DAILY ? days : undefined,
        comparisonPercentage,
      };
      
      // Update report record
      await db.query(
        `UPDATE revenue_reports
        SET 
          total_revenue = $1,
          total_tax = $2,
          status = $3,
          report_data = $4
        WHERE id = $5`,
        [totalRevenue, totalTax, ReportStatus.COMPLETED, JSON.stringify(report), reportId]
      );
      
      // Cache report
      cache.set(cacheKey, report, REPORT_CACHE_TTL);
      
      return report;
    } catch (error) {
      // Update report status to failed
      await db.query(
        `UPDATE revenue_reports
        SET status = $1
        WHERE id = $2`,
        [ReportStatus.FAILED, reportId]
      );
      
      throw error;
    }
  } catch (error) {
    logger.error('Failed to generate revenue report', {
      error: error instanceof Error ? error.message : String(error),
      options,
    });
    throw error;
  }
}

/**
 * Get a list of reports
 * 
 * @param type - Report type filter (optional)
 * @param limit - Maximum number of reports to return (optional)
 * @param offset - Offset for pagination (optional)
 * @returns List of report summaries
 */
export async function getReports(
  type?: ReportType,
  limit: number = 10,
  offset: number = 0
): Promise<ReportSummary[]> {
  try {
    const query = type
      ? `SELECT 
          id, report_type, start_date, end_date, generation_date, 
          total_revenue, total_tax, status, report_url
        FROM revenue_reports
        WHERE report_type = $1
        ORDER BY generation_date DESC
        LIMIT $2 OFFSET $3`
      : `SELECT 
          id, report_type, start_date, end_date, generation_date, 
          total_revenue, total_tax, status, report_url
        FROM revenue_reports
        ORDER BY generation_date DESC
        LIMIT $1 OFFSET $2`;
    
    const params = type
      ? [type, limit, offset]
      : [limit, offset];
    
    const result = await db.query(query, params);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      type: row.report_type,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      generationDate: new Date(row.generation_date),
      totalRevenue: parseFloat(row.total_revenue),
      totalTax: parseFloat(row.total_tax),
      status: row.status,
      reportUrl: row.report_url,
    }));
  } catch (error) {
    logger.error('Failed to get reports', {
      error: error instanceof Error ? error.message : String(error),
      type,
      limit,
      offset,
    });
    throw error;
  }
}

/**
 * Get a report by ID
 * 
 * @param id - Report ID
 * @returns Report or null if not found
 */
export async function getReportById(id: string): Promise<RevenueReport | null> {
  try {
    const result = await db.query(
      `SELECT *
      FROM revenue_reports
      WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    // If report data is available, return it
    if (row.report_data) {
      return {
        ...row.report_data,
        id: row.id,
        type: row.report_type,
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        generationDate: new Date(row.generation_date),
        totalRevenue: parseFloat(row.total_revenue),
        totalTax: parseFloat(row.total_tax),
        netRevenue: parseFloat(row.total_revenue) - parseFloat(row.total_tax),
      };
    }
    
    // Otherwise, regenerate the report
    return generateReport({
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      type: row.report_type as ReportType,
    });
  } catch (error) {
    logger.error('Failed to get report by ID', {
      error: error instanceof Error ? error.message : String(error),
      id,
    });
    throw error;
  }
}

/**
 * Delete a report
 * 
 * @param id - Report ID
 * @returns True if deleted, false if not found
 */
export async function deleteReport(id: string): Promise<boolean> {
  try {
    const result = await db.query(
      `DELETE FROM revenue_reports
      WHERE id = $1
      RETURNING id`,
      [id]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Failed to delete report', {
      error: error instanceof Error ? error.message : String(error),
      id,
    });
    throw error;
  }
}

export default {
  generateReport,
  getReports,
  getReportById,
  deleteReport,
  ReportType,
  ReportStatus,
};