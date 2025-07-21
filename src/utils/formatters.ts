import { format, parseISO } from 'date-fns';

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export const formatDate = (date: string | FirestoreTimestamp): string => {
  try {
    if (typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
      // Handle Firestore Timestamp
      const milliseconds = date.seconds * 1000 + date.nanoseconds / 1000000;
      return format(new Date(milliseconds), 'MMM d, yyyy h:mm a');
    }
    
    // Handle string dates
    const parsedDate = parseISO(date);
    return format(parsedDate, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const truncateText = (text: string, maxLength: number = 30): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
};

export const formatBoolean = (value: boolean): string => {
  return value ? 'Yes' : 'No';
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  // Simple phone formatter that handles common formats
  return phoneNumber
    .replace(/\D+/g, '')
    .replace(/(\d{2})(\d{3})(\d{4})(\d{4})/, '+$1 $2-$3-$4')
    .replace(/(\d{2})(\d{3})(\d{4})/, '+$1 $2-$3')
    .replace(/(\d{3})(\d{4})/, '$1-$2');
};