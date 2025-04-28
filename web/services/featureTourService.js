/**
 * Feature tour service for web
 * Handles feature tour state and analytics
 */

// Local storage keys
const FEATURE_TOUR_COMPLETED_KEY = 'feature_tour_completed';
const FEATURE_TOUR_STEPS_KEY = 'feature_tour_steps';

/**
 * Feature tour step type
 * @typedef {Object} FeatureTourStep
 * @property {string} id - Unique identifier for the step
 * @property {string} title - Step title
 * @property {string} description - Step description
 * @property {string} image - Path to step image
 * @property {boolean} completed - Whether the step has been completed
 */

/**
 * Get feature tour steps
 * @param {string} [language='en'] - Language code
 * @returns {Promise<FeatureTourStep[]>} Array of feature tour steps
 */
export const getFeatureTourSteps = async (language = 'en') => {
  try {
    // Validate language parameter to prevent security issues
    if (typeof language !== 'string') {
      console.error('Invalid language parameter:', language);
      language = 'en'; // Default to English for safety
    }
    
    // Sanitize language to only allow valid language codes
    const sanitizedLanguage = language.toLowerCase().trim().substring(0, 2);
    if (!['en', 'es'].includes(sanitizedLanguage)) {
      console.warn('Unsupported language:', language);
      language = 'en'; // Default to English for unsupported languages
    }
    
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage is not available, using default steps');
      return getDefaultSteps(sanitizedLanguage);
    }
    
    // Try to get saved steps from local storage with proper error handling
    try {
      const savedSteps = localStorage.getItem(FEATURE_TOUR_STEPS_KEY);
      if (savedSteps) {
        try {
          const parsedSteps = JSON.parse(savedSteps);
          
          // Validate the parsed data is an array
          if (!Array.isArray(parsedSteps)) {
            console.error('Saved steps is not an array, using default steps');
            return getDefaultSteps(sanitizedLanguage);
          }
          
          // Validate each step has the required properties
          const validSteps = parsedSteps.every(step => 
            step && 
            typeof step === 'object' && 
            typeof step.id === 'string' && 
            typeof step.title === 'string' && 
            typeof step.description === 'string'
          );
          
          if (!validSteps) {
            console.error('Saved steps contain invalid data, using default steps');
            return getDefaultSteps(sanitizedLanguage);
          }
          
          return parsedSteps;
        } catch (parseError) {
          console.error('Error parsing saved steps:', parseError);
          // If parsing fails, remove the corrupted data
          localStorage.removeItem(FEATURE_TOUR_STEPS_KEY);
          return getDefaultSteps(sanitizedLanguage);
        }
      }
    } catch (storageError) {
      console.warn('Error accessing localStorage:', storageError);
      return getDefaultSteps(sanitizedLanguage);
    }
    
    // If no saved steps, use defaults and save them
    const steps = getDefaultSteps(sanitizedLanguage);
    
    // Try to save the default steps to localStorage
    try {
      localStorage.setItem(FEATURE_TOUR_STEPS_KEY, JSON.stringify(steps));
    } catch (saveError) {
      console.warn('Error saving default steps to localStorage:', saveError);
      // Continue even if saving fails
    }
    
    return steps;
  } catch (error) {
    console.error('Error getting feature tour steps:', error);
    // Return empty array as fallback to prevent app crashes
    return [];
  }
};

/**
 * Get default feature tour steps
 * @param {string} language - Language code ('en' or 'es')
 * @returns {FeatureTourStep[]} Array of default feature tour steps
 */
const getDefaultSteps = (language) => {
  return [
    {
      id: 'aiPredictions',
      title: language === 'es' ? 'Encuentra Valor Donde Otros No' : 'Find Value Where Others Don\'t',
      description: language === 'es' 
        ? 'Nuestra IA no solo predice ganadores, encuentra VALOR. Observa exactamente dónde las casas de apuestas han establecido cuotas que no coinciden con las probabilidades reales.'
        : 'Our AI doesn\'t just predict winners—it finds VALUE. See exactly where the bookmakers have set odds that don\'t match the real probabilities.',
      image: '/images/feature-tour/ai-predictions.svg',
      hint: language === 'es'
        ? 'Los usuarios que siguen nuestras selecciones de IA ven una tasa de victorias un 15% más alta en promedio.'
        : 'Users who follow our AI picks see a 15% higher win rate on average.',
      completed: false
    },
    {
      id: 'realTimeOdds',
      title: language === 'es' ? 'Nunca Más Te Pierdas las Mejores Cuotas' : 'Never Miss the Best Odds Again',
      description: language === 'es'
        ? 'Observa cómo se mueven las cuotas en tiempo real en todas las principales casas de apuestas. Recibe alertas cuando hay valor para encontrar.'
        : 'Watch odds move in real-time across all major sportsbooks. Get alerts when there\'s value to be found.',
      image: '/images/feature-tour/real-time-odds.svg',
      hint: language === 'es'
        ? 'Obtener las mejores cuotas en cada apuesta puede aumentar tus rendimientos hasta un 12% sin riesgo adicional.'
        : 'Getting the best odds on every bet can increase your returns by up to 12% with no additional risk.',
      completed: false
    },
    {
      id: 'performanceDashboard',
      title: language === 'es' ? 'Tu Centro de Control de Apuestas' : 'Your Betting Command Center',
      description: language === 'es'
        ? 'Haz un seguimiento del rendimiento a lo largo del tiempo, observa dónde estás ganando y perdiendo dinero, y obtén sugerencias impulsadas por IA para mejorar.'
        : 'Track performance over time, see where you\'re making and losing money, and get AI-powered suggestions to improve.',
      image: '/images/feature-tour/performance-dashboard.svg',
      hint: language === 'es'
        ? 'Los usuarios que revisan regularmente su panel de control mejoran su ROI en un 8% en promedio.'
        : 'Users who regularly check their dashboard improve their ROI by 8% on average.',
      completed: false
    },
    {
      id: 'personalizedInsights',
      title: language === 'es' ? 'Tu Analista de Apuestas Personal' : 'Your Personal Betting Analyst',
      description: language === 'es'
        ? 'Recibe información personalizada basada en tus equipos favoritos, historial de apuestas y preferencias.'
        : 'Receive custom insights based on your favorite teams, betting history, and preferences.',
      image: '/images/feature-tour/personalized-insights.svg',
      hint: language === 'es'
        ? 'Los conocimientos personalizados ayudan a los usuarios a detectar un 23% más de oportunidades de apuestas valiosas.'
        : 'Personalized insights help users spot 23% more valuable betting opportunities.',
      completed: false
    },
    {
      id: 'premiumFeatures',
      title: language === 'es' ? 'Desbloquea Tu Máxima Ventaja' : 'Unlock Your Maximum Advantage',
      description: language === 'es'
        ? 'Vista previa de nuestras herramientas premium como optimizadores de parlay, analizadores de apuestas de proposición y análisis de impacto climático.'
        : 'Preview our premium tools like parlay optimizers, prop bet analyzers, and weather impact analysis.',
      image: '/images/feature-tour/premium-features.svg',
      hint: language === 'es'
        ? 'Los usuarios premium reportan rendimientos un 22% más altos que apostar por su cuenta.'
        : 'Premium users report 22% higher returns than betting on their own.',
      completed: false
    }
  ];
};

/**
 * Check if feature tour has been completed
 * @returns {Promise<boolean>} True if feature tour has been completed
 */
export const isFeatureTourCompleted = async () => {
  try {
    // Use a try-catch block to handle potential localStorage access issues
    // This can happen in private browsing mode or when storage is full
    const completed = localStorage.getItem(FEATURE_TOUR_COMPLETED_KEY);
    
    // Validate the value to prevent unexpected behavior
    if (completed !== 'true' && completed !== null) {
      console.warn('Invalid feature tour status value:', completed);
      // Reset to a valid state
      localStorage.setItem(FEATURE_TOUR_COMPLETED_KEY, 'false');
      return false;
    }
    
    return completed === 'true';
  } catch (error) {
    console.error('Error checking feature tour status:', error);
    // Graceful degradation - if we can't access localStorage, assume tour is not completed
    return false;
  }
};

/**
 * Mark feature tour as completed
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const markFeatureTourCompleted = async () => {
  try {
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      console.error('localStorage is not available');
      return false;
    }
    
    // Set the value with proper error handling
    localStorage.setItem(FEATURE_TOUR_COMPLETED_KEY, 'true');
    
    // Verify the value was set correctly
    const verifyValue = localStorage.getItem(FEATURE_TOUR_COMPLETED_KEY);
    if (verifyValue !== 'true') {
      console.error('Failed to set feature tour completion status');
      return false;
    }
    
    // Track feature tour completion with analytics in a separate try/catch
    try {
      if (window.gtag) {
        window.gtag('event', 'feature_tour_completed', {
          'event_category': 'engagement',
          'event_label': 'feature_tour',
          'timestamp': new Date().toISOString(),
        });
      }
    } catch (analyticsError) {
      // Don't let analytics errors affect the main functionality
      console.warn('Analytics error:', analyticsError);
    }
    
    return true;
  } catch (error) {
    console.error('Error marking feature tour as completed:', error);
    // Return false instead of throwing to prevent app crashes
    return false;
  }
};

/**
 * Mark a feature tour step as completed
 * @param {string} stepId - ID of the step to mark as completed
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const markFeatureTourStepCompleted = async (stepId) => {
  try {
    // Validate input to prevent security issues
    if (!stepId || typeof stepId !== 'string') {
      console.error('Invalid step ID:', stepId);
      return false;
    }
    
    // Sanitize the stepId to prevent XSS or injection attacks
    const sanitizedStepId = stepId.replace(/[^\w-]/g, '');
    if (sanitizedStepId !== stepId) {
      console.error('Step ID contained potentially unsafe characters');
      return false;
    }
    
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      console.error('localStorage is not available');
      return false;
    }
    
    const steps = await getFeatureTourSteps();
    
    // Verify the step exists before updating
    const stepExists = steps.some(step => step.id === stepId);
    if (!stepExists) {
      console.error('Step ID not found:', stepId);
      return false;
    }
    
    // Create a new array to avoid mutation
    const updatedSteps = steps.map(step => {
      if (step.id === stepId) {
        return { ...step, completed: true };
      }
      return step;
    });
    
    // Store with proper error handling
    try {
      localStorage.setItem(FEATURE_TOUR_STEPS_KEY, JSON.stringify(updatedSteps));
      
      // Verify the data was stored correctly
      const storedData = localStorage.getItem(FEATURE_TOUR_STEPS_KEY);
      const parsedData = JSON.parse(storedData);
      const stepUpdated = parsedData.some(step => step.id === stepId && step.completed === true);
      
      if (!stepUpdated) {
        console.error('Failed to verify step was marked as completed');
        return false;
      }
    } catch (storageError) {
      console.error('Error storing updated steps:', storageError);
      return false;
    }
    
    // Track step completion with analytics in a separate try/catch
    try {
      if (window.gtag) {
        window.gtag('event', 'feature_tour_step_completed', {
          'event_category': 'engagement',
          'event_label': `step_${stepId}`,
          'step_id': stepId,
          'timestamp': new Date().toISOString(),
        });
      }
    } catch (analyticsError) {
      // Don't let analytics errors affect the main functionality
      console.warn('Analytics error:', analyticsError);
    }
    
    return true;
  } catch (error) {
    console.error('Error marking feature tour step as completed:', error);
    return false;
  }
};

/**
 * Reset feature tour
 * @param {string} source - Source of the reset (e.g., 'settings', 'support')
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const resetFeatureTour = async (source = 'unknown') => {
  try {
    // Validate input to prevent security issues
    if (typeof source !== 'string') {
      console.warn('Invalid source parameter:', source);
      source = 'unknown';
    }
    
    // Sanitize the source to prevent XSS or injection attacks
    const sanitizedSource = source.replace(/[^\w-]/g, '');
    if (sanitizedSource !== source) {
      console.warn('Source contained potentially unsafe characters');
      source = 'unknown';
    }
    
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      console.error('localStorage is not available');
      return false;
    }
    
    // Remove items with proper error handling
    try {
      localStorage.removeItem(FEATURE_TOUR_COMPLETED_KEY);
      localStorage.removeItem(FEATURE_TOUR_STEPS_KEY);
    } catch (storageError) {
      console.error('Error removing feature tour data:', storageError);
      return false;
    }
    
    // Verify items were removed
    const completedCheck = localStorage.getItem(FEATURE_TOUR_COMPLETED_KEY);
    const stepsCheck = localStorage.getItem(FEATURE_TOUR_STEPS_KEY);
    
    if (completedCheck !== null || stepsCheck !== null) {
      console.warn('Failed to completely reset feature tour data');
    }
    
    // Track reset with analytics in a separate try/catch
    try {
      if (window.gtag) {
        window.gtag('event', 'feature_tour_reset', {
          'event_category': 'engagement',
          'event_label': 'feature_tour',
          'source': sanitizedSource,
          'timestamp': new Date().toISOString(),
        });
      }
    } catch (analyticsError) {
      // Don't let analytics errors affect the main functionality
      console.warn('Analytics error:', analyticsError);
    }
    
    return true;
  } catch (error) {
    console.error('Error resetting feature tour:', error);
    return false;
  }
};

export default {
  getFeatureTourSteps,
  isFeatureTourCompleted,
  markFeatureTourCompleted,
  markFeatureTourStepCompleted,
  resetFeatureTour,
};