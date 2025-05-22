// =============================================================================
// 2. MULTI-PROVIDER OCR ENGINE
// =============================================================================

const vision = require('@google-cloud/vision');
const AWS = require('aws-sdk');
const axios = require('axios');

class MultiProviderOCRService {
  constructor() {
    this.providers = {
      google: new vision.ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_VISION_KEY_FILE,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      }),
      aws: new AWS.Textract({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }),
      azure: {
        endpoint: process.env.AZURE_COMPUTER_VISION_ENDPOINT,
        apiKey: process.env.AZURE_COMPUTER_VISION_KEY,
      },
    };
  }

  async processWithMultipleProviders(imagePath, options = {}) {
    const {
      providers = ['google', 'aws'],
      useConsensus = true,
      confidenceThreshold = 0.7,
    } = options;

    console.log(`Processing image with providers: ${providers.join(', ')}`);

    const results = [];

    // Process with each provider
    for (const provider of providers) {
      try {
        const result = await this.processWithProvider(imagePath, provider);
        if (result) {
          results.push({
            provider,
            ...result,
          });
        }
      } catch (error) {
        console.error(`OCR failed with ${provider}:`, error.message);
      }
    }

    if (results.length === 0) {
      throw new Error('All OCR providers failed');
    }

    // Use consensus if multiple providers succeeded
    if (useConsensus && results.length > 1) {
      return this.buildConsensusResult(results);
    }

    // Return best single result
    return this.selectBestResult(results);
  }

  async processWithProvider(imagePath, provider) {
    const imageBuffer = require('fs').readFileSync(imagePath);

    switch (provider) {
      case 'google':
        return await this.processWithGoogle(imageBuffer);

      case 'aws':
        return await this.processWithAWS(imageBuffer);

      case 'azure':
        return await this.processWithAzure(imageBuffer);

      default:
        throw new Error(`Unknown OCR provider: ${provider}`);
    }
  }

  async processWithGoogle(imageBuffer) {
    try {
      const [result] = await this.providers.google.textDetection({
        image: { content: imageBuffer },
      });

      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        return null;
      }

      const fullText = detections[0].description;
      const confidence = detections[0].confidence || 0.8;

      // Extract individual text blocks with positions
      const textBlocks = detections.slice(1).map(detection => ({
        text: detection.description,
        confidence: detection.confidence || 0.8,
        boundingBox: detection.boundingPoly.vertices,
      }));

      return {
        fullText,
        confidence,
        textBlocks,
        provider: 'google',
      };
    } catch (error) {
      console.error('Google Vision OCR failed:', error);
      return null;
    }
  }

  async processWithAWS(imageBuffer) {
    try {
      const result = await this.providers.aws
        .detectDocumentText({
          Document: { Bytes: imageBuffer },
        })
        .promise();

      if (!result.Blocks || result.Blocks.length === 0) {
        return null;
      }

      // Extract text blocks
      const textBlocks = result.Blocks.filter(block => block.BlockType === 'WORD').map(block => ({
        text: block.Text,
        confidence: block.Confidence / 100,
        boundingBox: this.convertAWSBoundingBox(block.Geometry.BoundingBox),
      }));

      const fullText = result.Blocks.filter(block => block.BlockType === 'LINE')
        .map(block => block.Text)
        .join('\n');

      const avgConfidence =
        textBlocks.length > 0
          ? textBlocks.reduce((sum, block) => sum + block.confidence, 0) / textBlocks.length
          : 0;

      return {
        fullText,
        confidence: avgConfidence,
        textBlocks,
        provider: 'aws',
      };
    } catch (error) {
      console.error('AWS Textract OCR failed:', error);
      return null;
    }
  }

  async processWithAzure(imageBuffer) {
    try {
      const endpoint = `${this.providers.azure.endpoint}/vision/v3.2/ocr`;

      const response = await axios.post(endpoint, imageBuffer, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.providers.azure.apiKey,
          'Content-Type': 'application/octet-stream',
        },
        params: {
          language: 'en',
          detectOrientation: true,
        },
      });

      const { regions } = response.data;
      if (!regions || regions.length === 0) {
        return null;
      }

      let fullText = '';
      const textBlocks = [];

      regions.forEach(region => {
        region.lines.forEach(line => {
          line.words.forEach(word => {
            textBlocks.push({
              text: word.text,
              confidence: 0.8, // Azure doesn't provide word-level confidence
              boundingBox: this.convertAzureBoundingBox(word.boundingBox),
            });
          });
          fullText += line.words.map(w => w.text).join(' ') + '\n';
        });
      });

      return {
        fullText: fullText.trim(),
        confidence: 0.8,
        textBlocks,
        provider: 'azure',
      };
    } catch (error) {
      console.error('Azure Computer Vision OCR failed:', error);
      return null;
    }
  }

  buildConsensusResult(results) {
    console.log('Building consensus from multiple OCR results');

    // Find common text elements across providers
    const consensusBlocks = [];
    const allTexts = results.map(r => r.fullText);

    // Simple consensus: take the result with highest confidence
    const bestResult = results.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    // Enhance with cross-validation
    const enhancedResult = {
      ...bestResult,
      consensus: true,
      providerCount: results.length,
      alternativeTexts: allTexts.filter(text => text !== bestResult.fullText),
    };

    return enhancedResult;
  }

  selectBestResult(results) {
    // Select result with highest confidence
    return results.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );
  }

  convertAWSBoundingBox(awsBoundingBox) {
    // Convert AWS bounding box format to Google Vision format
    const { Left, Top, Width, Height } = awsBoundingBox;
    return [
      { x: Left, y: Top },
      { x: Left + Width, y: Top },
      { x: Left + Width, y: Top + Height },
      { x: Left, y: Top + Height },
    ];
  }

  convertAzureBoundingBox(azureBoundingBox) {
    // Convert Azure bounding box format
    const coords = azureBoundingBox.split(',').map(Number);
    const [x, y, width, height] = coords;
    return [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];
  }
}

module.exports = MultiProviderOCRService;
