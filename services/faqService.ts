/**
 * FAQ Service
 * Handles fetching and managing FAQ data for the Knowledge Edge screen
 */

export interface FAQQuestion {
  id: string;
  question: string;
  answer: string;
  approved: boolean;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetches approved questions from the database
 * @returns Promise<FAQQuestion[]> Array of approved FAQ questions
 */
export const getApprovedQuestions = async (): Promise<FAQQuestion[]> => {
  // In a real implementation, this would fetch from Firebase or another backend
  // For now, we'll return mock data
  return [
    {
      id: 'high-confidence',
      question: 'What does a "high confidence" prediction mean?',
      answer:
        'A high confidence prediction indicates that our model has identified a significant edge based on multiple factors aligning in favor of a particular outcome. These predictions historically perform better than standard predictions, though all betting carries inherent risk.',
      approved: true,
      category: 'predictions',
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-01-15'),
    },
    {
      id: 'model-accuracy',
      question: 'How accurate is the AI prediction model?',
      answer:
        'Our AI prediction model has demonstrated an accuracy rate of approximately 58-62% across all sports when predicting against the spread. This varies by sport, with some sports showing higher accuracy rates due to more consistent statistical patterns and data availability.',
      approved: true,
      category: 'predictions',
      createdAt: new Date('2025-01-20'),
      updatedAt: new Date('2025-02-05'),
    },
    {
      id: 'data-sources',
      question: 'What data sources does the app use for predictions?',
      answer:
        'The app uses a combination of historical game data, player statistics, team performance metrics, betting market movements, weather conditions (for outdoor sports), injury reports, and proprietary algorithms to generate predictions. All data is sourced from official league APIs and reputable sports data providers.',
      approved: true,
      category: 'data',
      createdAt: new Date('2025-01-25'),
      updatedAt: new Date('2025-01-25'),
    },
  ];
};

/**
 * Submits a new FAQ question for approval
 * @param question The question text
 * @param email User's email for notification when answered
 * @returns Promise<boolean> Success status
 */
export const submitQuestion = async (question: string, email?: string): Promise<boolean> => {
  // In a real implementation, this would submit to Firebase or another backend
  // For now, we'll just return success
  console.log('Question submitted:', question, email);
  return true;
};
