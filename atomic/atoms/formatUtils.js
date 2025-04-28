// External imports

// Internal imports

return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
export const formatCurrency = (amount, locale = 'en-US', currency = 'USD') => {};
