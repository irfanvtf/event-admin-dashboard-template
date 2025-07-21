import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import { Customer } from "../types";

// Parse the QR code to extract the ID number
export const parseQRCode = (qrCode: string): string | null => {
  // Format: "aux-training-950920-08-6687" or "950920-08-6687"
  const parts = qrCode.split("-");

  // Check if the QR code has the expected format with prefix
  if (parts.length >= 3 && parts[0] === "aux" && parts[1] === "training") {
    // Extract the ID number (last parts of the QR code)
    return parts.slice(2).join("-");
  }

  // Check if the QR code is just the ID number without the prefix
  // Format: "950920-08-6687"
  const idNumberPattern = /^\d{6}-\d{2}-\d{4}$/;
  if (idNumberPattern.test(qrCode)) {
    return qrCode;
  }

  return null;
};

// Find a customer by ID number
export const findCustomerByIdNumber = async (
  idNumber: string
): Promise<Customer | null> => {
  try {
    const customersRef = collection(db, "registrations");
    const q = query(customersRef, where("idNumber", "==", idNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Return the first matching customer
    const customerDoc = querySnapshot.docs[0];
    return {
      id: customerDoc.id,
      ...customerDoc.data(),
    } as Customer;
  } catch (error) {
    console.error("Error finding customer by ID number:", error);
    throw error;
  }
};

// Check in a customer
export const checkInCustomer = async (
  customerId: string
): Promise<{
  success: boolean;
  message: string;
  status?: string;
  timestamp?: Timestamp;
}> => {
  try {
    const customerRef = doc(db, "registrations", customerId);
    const customerSnapshot = await getDocs(
      query(
        collection(db, "registrations"),
        where("__name__", "==", customerId)
      )
    );

    if (customerSnapshot.empty) {
      return {
        success: false,
        message: "Customer not found",
      };
    }

    const customerData = customerSnapshot.docs[0].data();

    // Check if the customer already has a status
    if (customerData && customerData.status) {
      if (customerData.status === "checked-in") {
        // Customer already checked in
        return {
          success: false,
          message: `User has already checked in at ${new Date(
            customerData.checkTimeStamp.seconds * 1000
          ).toLocaleString()}`,
          status: "checked-in",
          timestamp: customerData.checkTimeStamp,
        };
      } else {
        // Customer has a different status
        return {
          success: false,
          message: `User status is ${customerData.status}`,
          status: customerData.status,
        };
      }
    }

    // Update the customer with checked-in status
    const now = Timestamp.now();
    await updateDoc(customerRef, {
      status: "checked-in",
      checkTimeStamp: now,
    });

    return {
      success: true,
      message: "Check-in successful",
      status: "checked-in",
      timestamp: now,
    };
  } catch (error) {
    console.error("Error checking in customer:", error);
    throw error;
  }
};

// Process a QR code scan for check-in
export const processCheckIn = async (
  qrCode: string
): Promise<{
  success: boolean;
  message: string;
  customer?: Customer;
  status?: string;
  timestamp?: Timestamp;
}> => {
  try {
    // Parse the QR code to extract the ID number
    const idNumber = parseQRCode(qrCode);

    if (!idNumber) {
      return {
        success: false,
        message: "Invalid QR code format",
      };
    }

    // Find the customer by ID number
    const customer = await findCustomerByIdNumber(idNumber);
    console.log("customer", customer);

    if (!customer) {
      return {
        success: false,
        message: `No customer found with ID number: ${idNumber}`,
      };
    }

    // Check in the customer
    const checkInResult = await checkInCustomer(customer.id);

    return {
      ...checkInResult,
      customer,
    };
  } catch (error) {
    console.error("Error processing check-in:", error);
    return {
      success: false,
      message: "An error occurred while processing the check-in",
    };
  }
};

/**
 * Clears the check-in status for a customer by removing the 'status' and 'checkTimeStamp' fields
 * @param customerId The ID of the customer to clear check-in status for
 * @returns Promise resolving to a boolean indicating success or failure
 */
export const clearCheckInStatus = async (
  customerId: string
): Promise<boolean> => {
  try {
    const customerRef = doc(db, "registrations", customerId);

    // Update the document to remove the status and checkTimeStamp fields
    await updateDoc(customerRef, {
      status: deleteField(),
      checkTimeStamp: deleteField(),
    });

    return true;
  } catch (error) {
    console.error("Error clearing check-in status:", error);
    return false;
  }
};

// Export check-in records to CSV
export const exportToCSV = (registrations: any[]): void => {
  const headers = [
    "Name",
    "Company",
    "ID Number",
    "Email",
    "Contact Number",
    "Customer Type",
    "Check-In Time",
    "Status",
  ];

  const csvContent = [
    headers.join(","),
    ...registrations.map((registration) =>
      [
        `"${registration.fullName || ""}"`,
        `"${registration.dealerCompanyName || ""}"`,
        `"${registration.idNumber || ""}"`,
        `"${registration.emailAddress || ""}"`,
        `"${registration.contactNumber || ""}"`,
        `"${registration.customerType || ""}"`,
        `"${formatCheckInTime(registration.checkTimeStamp) || ""}"`,
        `"${registration.status || "Not Checked In"}"`,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `check_in_records_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Format check-in timestamp for CSV export
const formatCheckInTime = (timestamp: any): string => {
  if (!timestamp) return "Not checked in";

  try {
    // Check if it's a Firestore timestamp object with seconds
    if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
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

    return "Date not available";
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Date not available";
  }
};
