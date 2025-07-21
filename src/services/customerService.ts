import { db } from "./firebase";
import {
  collection,
  query,
  getDocs,
  orderBy,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Customer, SortConfig, FilterConfig } from "../types";

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Customer[];
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
};

export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "registrations", id));
  } catch (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
};

// Helper function to format dates correctly for CSV export
const formatDate = (dateValue: any): string => {
  if (!dateValue) return "";

  try {
    // Handle Firestore timestamp objects
    if (dateValue && typeof dateValue === "object" && "seconds" in dateValue) {
      return new Date(dateValue.seconds * 1000).toLocaleString();
    }

    // Handle string date formats
    if (typeof dateValue === "string") {
      // Try parsing the string date
      const date = new Date(dateValue);
      // Check if the date is valid
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
      // If it's not a valid date format, return the original string
      return dateValue;
    }

    // Handle numeric timestamps
    if (typeof dateValue === "number") {
      return new Date(dateValue).toLocaleString();
    }

    // Default case: return empty string for invalid dates
    return "";
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

export const exportToCSV = (customers: Customer[]): void => {
  const headers = [
    "Full Name",
    "Email Address",
    "Contact Number",
    "Customer Type",
    "Dealer Company",
    "ID Type",
    "ID Number",
    "T-Shirt Size",
    "App Downloaded",
    "Created At",
  ];

  const csvContent = [
    headers.join(","),
    ...customers.map((customer) =>
      [
        `"${customer.fullName}"`,
        `"${customer.emailAddress}"`,
        `"${customer.contactNumber}"`,
        `"${customer.customerType}"`,
        `"${customer.dealerCompanyName || ""}"`,
        `"${customer.idType}"`,
        `"${customer.idNumber}"`,
        `"${customer.tshirtSize}"`,
        `"${customer.appDownloaded ? "Yes" : "No"}"`,
        `"${formatDate(customer.createdAt)}"`,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `customers_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const searchAndSortCustomers = (
  customers: Customer[],
  filter: FilterConfig,
  sort: SortConfig
): Customer[] => {
  let filteredCustomers = customers.filter((customer) => {
    const searchTerm = filter.search?.toLowerCase() || "";

    // Location filter
    if (filter.locationId && customer.locationId !== filter.locationId) {
      return false;
    }

    // Search filter
    if (!searchTerm) return true;

    return (
      customer.fullName.toLowerCase().includes(searchTerm) ||
      customer.emailAddress.toLowerCase().includes(searchTerm) ||
      customer.contactNumber.includes(searchTerm) ||
      customer.idNumber.toLowerCase().includes(searchTerm) ||
      customer.customerType.toLowerCase().includes(searchTerm) ||
      (customer.dealerCompanyName &&
        customer.dealerCompanyName.toLowerCase().includes(searchTerm))
    );
  });

  // Sorting logic remains unchanged...
  if (sort.key) {
    filteredCustomers = [...filteredCustomers].sort((a, b) => {
      const aValue = a[sort.key as keyof Customer];
      const bValue = b[sort.key as keyof Customer];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sort.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        return sort.direction === "asc"
          ? aValue === bValue
            ? 0
            : aValue
            ? 1
            : -1
          : aValue === bValue
          ? 0
          : aValue
          ? -1
          : 1;
      }

      return 0;
    });
  }

  return filteredCustomers;
};
