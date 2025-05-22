import { BetSlip, BetLeg, OCRUpload, UserAnalytics } from '../types/betting';

export class BetSlipAPI {
  private static baseUrl = '/api';

  static async createBetSlip(
    betSlipData: Partial<BetSlip>
  ): Promise<{ success: boolean; betSlipId: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/bet-slips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(betSlipData),
      });

      if (!response.ok) {
        throw new Error('Failed to create bet slip');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating bet slip:', error);
      throw error;
    }
  }

  static async getBetSlips(
    params: Record<string, any> = {}
  ): Promise<{ betSlips: BetSlip[]; total: number; hasMore: boolean }> {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`${this.baseUrl}/bet-slips?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch bet slips');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching bet slips:', error);
      throw error;
    }
  }

  static async uploadOCRImage(
    file: File,
    userTier: string
  ): Promise<{ uploadId: string; status: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userTier', userTier);

      const response = await fetch(`${this.baseUrl}/ocr/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading OCR image:', error);
      throw error;
    }
  }

  static async getOCRStatus(uploadId: string): Promise<OCRUpload> {
    try {
      const response = await fetch(`${this.baseUrl}/ocr/status/${uploadId}`);

      if (!response.ok) {
        throw new Error('Failed to get OCR status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting OCR status:', error);
      throw error;
    }
  }

  static async getModelPrediction(
    params: Record<string, any>
  ): Promise<{ odds: number; confidence: number; edge: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/model/prediction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to get model prediction');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting model prediction:', error);
      throw error;
    }
  }

  static async getUserAnalytics(
    timeframe = 'all',
    sport: string | null = null
  ): Promise<UserAnalytics> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('timeframe', timeframe);

      if (sport) {
        queryParams.append('sport', sport);
      }

      const response = await fetch(
        `${this.baseUrl}/analytics/betting-performance?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to get user analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }
}
