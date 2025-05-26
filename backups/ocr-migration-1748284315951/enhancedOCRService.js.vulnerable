// =============================================================================
// 4. ENHANCED OCR SERVICE INTEGRATION
// =============================================================================

const { PrismaClient } = require('@prisma/client');
const ImagePreprocessingService = require('./imagePreprocessingService');
const MultiProviderOCRService = require('./multiProviderOCRService');
const IntelligentBetSlipParser = require('./intelligentBetSlipParser');

const prisma = new PrismaClient();

class EnhancedOCRService {
  constructor() {
    this.imagePreprocessor = new ImagePreprocessingService();
    this.multiProviderOCR = new MultiProviderOCRService();
    this.intelligentParser = new IntelligentBetSlipParser();
  }

  async processOCRWithEnhancements(uploadId, options = {}) {
    const {
      usePreprocessing = true,
      useMultiProvider = true,
      useIntelligentParsing = true,
      providers = ['google', 'aws'],
      preprocessingOptions = {},
    } = options;

    try {
      console.log(`Starting enhanced OCR processing for upload ${uploadId}`);

      // Update status
      await prisma.oCRUpload.update({
        where: { id: uploadId },
        data: { status: 'processing' },
      });

      const upload = await prisma.oCRUpload.findUnique({
        where: { id: uploadId },
      });

      if (!upload) {
        throw new Error('Upload not found');
      }

      let imagePath = upload.uploadPath;
      let preprocessingResult = null;

      // Step 1: Image preprocessing
      if (usePreprocessing) {
        console.log('Preprocessing image for better OCR accuracy');
        preprocessingResult = await this.imagePreprocessor.preprocessImage(
          imagePath,
          preprocessingOptions
        );
        imagePath = preprocessingResult.processedPath;
      }

      // Step 2: Multi-provider OCR
      let ocrResult;
      if (useMultiProvider) {
        console.log(`Processing with multiple OCR providers: ${providers.join(', ')}`);
        ocrResult = await this.multiProviderOCR.processWithMultipleProviders(imagePath, {
          providers,
          useConsensus: true,
        });
      } else {
        console.log('Processing with single OCR provider');
        ocrResult = await this.multiProviderOCR.processWithProvider(imagePath, providers[0]);
      }

      if (!ocrResult) {
        throw new Error('OCR processing failed - no text detected');
      }

      // Step 3: Intelligent parsing
      let parsedData;
      if (useIntelligentParsing) {
        console.log('Applying intelligent parsing to OCR results');
        parsedData = await this.intelligentParser.parseExtractedText(ocrResult, {
          useContextualAnalysis: true,
          validateConsistency: true,
        });
      } else {
        // Fallback to simple parsing
        parsedData = await this.intelligentParser.parseExtractedText(ocrResult, {
          useContextualAnalysis: false,
          validateConsistency: false,
        });
      }

      // Step 4: Update database with results
      await prisma.oCRUpload.update({
        where: { id: uploadId },
        data: {
          status: 'completed',
          ocrProvider: ocrResult.provider,
          confidence: parsedData.finalConfidence,
          extractedText: ocrResult.fullText,
          parsedData: JSON.stringify(parsedData),
          processedAt: new Date(),
        },
      });

      // Step 5: Clean up temporary files
      if (preprocessingResult) {
        require('fs').unlink(preprocessingResult.processedPath, err => {
          if (err) console.error('Failed to clean up processed image:', err);
        });
      }

      console.log(`Enhanced OCR processing completed for upload ${uploadId}`);
      console.log(`Final confidence: ${parsedData.finalConfidence}`);

      return {
        success: true,
        confidence: parsedData.finalConfidence,
        parsedData,
        ocrResult,
        preprocessingResult,
      };
    } catch (error) {
      console.error(`Enhanced OCR processing failed for upload ${uploadId}:`, error);

      await prisma.oCRUpload
        .update({
          where: { id: uploadId },
          data: {
            status: 'failed',
            errorMessage: error.message,
            processedAt: new Date(),
          },
        })
        .catch(console.error);

      throw error;
    }
  }

  async getProcessingStatus(uploadId) {
    const upload = await prisma.oCRUpload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      throw new Error('Upload not found');
    }

    return {
      status: upload.status,
      confidence: upload.confidence,
      parsedData: upload.parsedData ? JSON.parse(upload.parsedData) : null,
      errorMessage: upload.errorMessage,
      processedAt: upload.processedAt,
    };
  }

  async getAccuracyMetrics(timeRange = '30days') {
    const since = new Date();
    since.setDate(since.getDate() - (timeRange === '30days' ? 30 : 7));

    const uploads = await prisma.oCRUpload.findMany({
      where: {
        status: 'completed',
        processedAt: { gte: since },
      },
      select: {
        confidence: true,
        ocrProvider: true,
        processedAt: true,
      },
    });

    const metrics = {
      totalProcessed: uploads.length,
      averageConfidence: 0,
      providerBreakdown: {},
      confidenceDistribution: {
        high: 0, // > 0.8
        medium: 0, // 0.6 - 0.8
        low: 0, // < 0.6
      },
    };

    if (uploads.length > 0) {
      metrics.averageConfidence =
        uploads.reduce((sum, upload) => sum + (upload.confidence || 0), 0) / uploads.length;

      uploads.forEach(upload => {
        // Provider breakdown
        const provider = upload.ocrProvider || 'unknown';
        if (!metrics.providerBreakdown[provider]) {
          metrics.providerBreakdown[provider] = { count: 0, avgConfidence: 0 };
        }
        metrics.providerBreakdown[provider].count++;
        metrics.providerBreakdown[provider].avgConfidence += upload.confidence || 0;

        // Confidence distribution
        const confidence = upload.confidence || 0;
        if (confidence > 0.8) {
          metrics.confidenceDistribution.high++;
        } else if (confidence > 0.6) {
          metrics.confidenceDistribution.medium++;
        } else {
          metrics.confidenceDistribution.low++;
        }
      });

      // Calculate average confidence per provider
      Object.keys(metrics.providerBreakdown).forEach(provider => {
        const data = metrics.providerBreakdown[provider];
        data.avgConfidence = data.avgConfidence / data.count;
      });
    }

    return metrics;
  }
}

module.exports = EnhancedOCRService;
