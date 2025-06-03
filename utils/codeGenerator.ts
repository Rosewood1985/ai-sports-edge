/**
 * Generate a random alphanumeric code
 * @param length Length of the code to generate
 * @returns Random alphanumeric code
 */
export const generateRandomCode = (length: number): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters like I, 1, O, 0
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
};

/**
 * Generate a random numeric code
 * @param length Length of the code to generate
 * @returns Random numeric code
 */
export const generateNumericCode = (length: number): string => {
  const characters = '0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
};

/**
 * Format a gift code for display
 * @param code Gift code to format
 * @returns Formatted gift code (e.g., ABCD-1234)
 */
export const formatGiftCode = (code: string): string => {
  if (code.length <= 4) {
    return code;
  }

  // Split the code into chunks of 4 characters
  const chunks = [];
  for (let i = 0; i < code.length; i += 4) {
    chunks.push(code.slice(i, i + 4));
  }

  return chunks.join('-');
};

/**
 * Validate a gift code format
 * @param code Gift code to validate
 * @returns Boolean indicating if the code is valid
 */
export const isValidGiftCode = (code: string): boolean => {
  // Remove any hyphens or spaces
  const cleanCode = code.replace(/[-\s]/g, '');

  // Check if the code is alphanumeric and has a valid length
  return /^[A-Z0-9]{6,16}$/i.test(cleanCode);
};

/**
 * Normalize a gift code (remove hyphens, spaces, and convert to uppercase)
 * @param code Gift code to normalize
 * @returns Normalized gift code
 */
export const normalizeGiftCode = (code: string): string => {
  return code.replace(/[-\s]/g, '').toUpperCase();
};
