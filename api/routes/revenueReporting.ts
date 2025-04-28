/**
 * Revenue Reporting API Routes
 */

import express, { Request, Response } from 'express';
import revenueReportingService, { ReportType } from '../../services/revenueReportingService';
import logger from '../../utils/logger';

// Define user interface for request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

const router = express.Router();

// Get a list of revenue reports
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as ReportType | undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const reports = await revenueReportingService.getReports(type, limit, offset);
    
    res.json({ success: true, data: reports });
  } catch (error) {
    logger.error('Failed to get reports', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    res.status(500).json({ success: false, error: 'Failed to get reports' });
  }
});

// Get a revenue report by ID
router.get('/reports/:id', async (req: Request, res: Response) => {
  try {
    const report = await revenueReportingService.getReportById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Failed to get report', {
      error: error instanceof Error ? error.message : String(error),
      id: req.params.id,
    });
    
    res.status(500).json({ success: false, error: 'Failed to get report' });
  }
});

// Generate a revenue report
router.post('/reports', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate, type, format } = req.body;
    
    // Validate inputs
    if (!startDate || !endDate || !type) {
      return res.status(400).json({
        success: false,
        error: 'Start date, end date, and type are required',
      });
    }
    
    // Generate report
    const report = await revenueReportingService.generateReport({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type: type as ReportType,
      format: format || 'json',
      userId: req.user?.id,
    });
    
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Failed to generate report', {
      error: error instanceof Error ? error.message : String(error),
      body: req.body,
    });
    
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

// Delete a revenue report
router.delete('/reports/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await revenueReportingService.deleteReport(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete report', {
      error: error instanceof Error ? error.message : String(error),
      id: req.params.id,
    });
    
    res.status(500).json({ success: false, error: 'Failed to delete report' });
  }
});

export default router;