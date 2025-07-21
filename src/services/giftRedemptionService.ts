import { db } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, deleteField } from 'firebase/firestore';
import { Customer } from '../types';

// Parse the QR code to extract the ID number - similar to check-in service
export const parseQRCode = (qrCode: string): string | null => {
  // Format: "aux-training-950920-08-6687" or "950920-08-6687" or "950920086687"
  const parts = qrCode.split('-');
  
  // Check if the QR code has the expected format with prefix
  if (parts.length >= 3 && parts[0] === 'aux' && parts[1] === 'training') {
    // Extract the ID number (last parts of the QR code)
    return parts.slice(2).join('-');
  }
  
  // Check if the QR code is just the ID number with dashes (XXXXXX-XX-XXXX)
  const idNumberWithDashesPattern = /^\d{6}-\d{2}-\d{4}$/;
  if (idNumberWithDashesPattern.test(qrCode)) {
    return qrCode;
  }
  
  // Check if the QR code is the ID number without dashes (XXXXXXXXXXXX)
  const idNumberWithoutDashesPattern = /^\d{12}$/;
  if (idNumberWithoutDashesPattern.test(qrCode)) {
    // Format it with dashes
    return `${qrCode.substring(0, 6)}-${qrCode.substring(6, 8)}-${qrCode.substring(8, 12)}`;
  }
  
  return null;
};

// Find a customer by ID number
export const findCustomerByIdNumber = async (idNumber: string): Promise<Customer | null> => {
  try {
    const customersRef = collection(db, 'registrations');
    const q = query(customersRef, where('idNumber', '==', idNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Return the first matching customer
    const customerDoc = querySnapshot.docs[0];
    return {
      id: customerDoc.id,
      ...customerDoc.data()
    } as Customer;
  } catch (error) {
    console.error('Error finding customer by ID number:', error);
    throw error;
  }
};

// Process gift redemption
export const processGiftRedemption = async (qrCode: string): Promise<{ 
  success: boolean; 
  message: string;
  customer?: Customer;
  redeemed?: boolean;
  timestamp?: Timestamp;
}> => {
  try {
    // Parse the QR code
    const idNumber = parseQRCode(qrCode);
    
    if (!idNumber) {
      return {
        success: false,
        message: 'Invalid QR code format'
      };
    }
    
    // Find the customer by ID number
    const customer = await findCustomerByIdNumber(idNumber);
    
    if (!customer) {
      return {
        success: false,
        message: 'Customer not found with this ID number'
      };
    }
    
    // Check if the customer has already redeemed their gift
    if (customer.redeemedGift) {
      return {
        success: false,
        message: `Gift has already been redeemed at ${new Date(customer.redemptionTimeStamp?.seconds * 1000).toLocaleString() || 'an earlier time'}`,
        customer,
        redeemed: true
      };
    }
    
    // Mark the gift as redeemed
    const customerRef = doc(db, 'registrations', customer.id);
    const now = Timestamp.now();
    await updateDoc(customerRef, {
      redeemedGift: true,
      redemptionTimeStamp: now
    });
    
    return {
      success: true,
      message: 'Gift redemption successful',
      customer,
      redeemed: true,
      timestamp: now
    };
  } catch (error) {
    console.error('Error processing gift redemption:', error);
    return {
      success: false,
      message: 'An error occurred while processing the gift redemption'
    };
  }
};

/**
 * Clears the gift redemption status for a customer by removing the 'redeemedGift' and 'redemptionTimeStamp' fields
 * @param customerId The ID of the customer to clear gift redemption status for
 * @returns Promise resolving to a boolean indicating success or failure
 */
export const clearGiftRedemptionStatus = async (customerId: string): Promise<boolean> => {
  try {
    const customerRef = doc(db, 'registrations', customerId);
    
    // Update the document to remove the redemption fields
    await updateDoc(customerRef, {
      redeemedGift: false,
      redemptionTimeStamp: deleteField()
    });
    
    return true;
  } catch (error) {
    console.error('Error clearing gift redemption status:', error);
    return false;
  }
};

// Export gift redemption records to CSV
export const exportToCSV = (registrations: Customer[]): void => {
  const headers = [
    'Name',
    'Company',
    'ID Number',
    'Email',
    'Contact Number',
    'Customer Type',
    'Redemption Time',
    'Status'
  ];

  const csvContent = [
    headers.join(','),
    ...registrations.map(registration => [
      `"${registration.fullName || ''}"`,
      `"${registration.dealerCompanyName || ''}"`,
      `"${registration.idNumber || ''}"`,
      `"${registration.emailAddress || ''}"`,
      `"${registration.contactNumber || ''}"`,
      `"${registration.customerType || ''}"`,
      `"${formatRedemptionTime(registration.redemptionTimeStamp) || ''}"`,
      `"${registration.redeemedGift ? 'Redeemed' : 'Not Redeemed'}"`,
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `gift_redemption_records_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Format redemption timestamp for CSV export
const formatRedemptionTime = (timestamp: any): string => {
  if (!timestamp) return 'Not redeemed';
  
  try {
    // Check if it's a Firestore timestamp object with seconds
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleString();
    }
    
    // For other date formats, try to parse as Date object
    if (timestamp) {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
    
    return 'Date not available';
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Date not available';
  }
};
