// Input validation utilities for enhanced security

export const validateTitle = (title: string): string | null => {
  if (!title || title.trim().length === 0) {
    return 'Title is required';
  }
  
  if (title.length > 200) {
    return 'Title must be less than 200 characters';
  }
  
  // Check for potentially malicious content
  const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  if (scriptPattern.test(title)) {
    return 'Title contains invalid characters';
  }
  
  return null;
};

export const validateDescription = (description: string): string | null => {
  if (description && description.length > 2000) {
    return 'Description must be less than 2000 characters';
  }
  
  // Check for potentially malicious content
  const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  if (scriptPattern.test(description)) {
    return 'Description contains invalid characters';
  }
  
  return null;
};

export const validateCategory = (category: string): string | null => {
  if (category && category.length > 100) {
    return 'Category must be less than 100 characters';
  }
  
  // Allow alphanumeric, spaces, hyphens, commas, and ampersands
  const validPattern = /^[a-zA-Z0-9\s,&-]*$/;
  if (category && !validPattern.test(category)) {
    return 'Category contains invalid characters';
  }
  
  return null;
};

export const formatCategory = (category: string): string => {
  return category.toUpperCase();
};

export const validateImageFile = (file: File): string | null => {
  // File size limit: 10MB
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'Image file size must be less than 10MB';
  }
  
  // Only allow specific image types including SVG
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return 'Only JPEG, PNG, WebP, GIF, and SVG images are allowed';
  }
  
  return null;
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

export const sanitizeInputForSubmit = (input: string): string => {
  return sanitizeInput(input).trim(); // Only trim on submit
};