import { db } from "./firebase";
import {
  collection,
  query,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { SurveyResponse } from "../types";

export const getSurveyResponses = async (): Promise<SurveyResponse[]> => {
  try {
    const surveyResponsesRef = collection(db, "surveyResponses");
    const q = query(surveyResponsesRef, orderBy("submitted", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SurveyResponse[];
  } catch (error) {
    console.error("Error fetching survey responses:", error);
    throw error;
  }
};

export const getSurveyResponseById = async (
  id: string
): Promise<SurveyResponse | null> => {
  try {
    const docRef = doc(db, "surveyResponses", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as SurveyResponse;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching survey response:", error);
    throw error;
  }
};

export const deleteSurveyResponse = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "surveyResponses", id));
  } catch (error) {
    console.error("Error deleting survey response:", error);
    throw error;
  }
};

// Helper function to format timestamp for CSV export
const formatTimestampForCSV = (timestamp: any): string => {
  try {
    // Check if it's a Firestore timestamp object with seconds and nanoseconds
    if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
      // Convert Firestore timestamp to JavaScript Date
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleString();
    }

    // Check if it's a string in Firestore timestamp format
    if (
      timestamp &&
      typeof timestamp === "string" &&
      timestamp.includes("at")
    ) {
      // Return the formatted string directly as it's already human-readable
      return timestamp;
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
    console.error("Error formatting date for CSV:", e);
    return "Date not available";
  }
};

export const exportToCSV = (surveyResponses: SurveyResponse[]): void => {
  const headers = [
    "Name",
    "Email",
    "Contact Number",
    "Feedback",
    "Marketing Rating",
    "Presenter - Jayden Kok",
    "Presenter - Lee Weng Fai",
    "Session - App",
    "Session - Commercial",
    "Session - Installation",
    "Session - Residential",
    "Submitted",
    "User ID",
    "Event Location ID",
  ];

  const csvContent = [
    headers.join(","),
    ...surveyResponses.map((response) =>
      [
        `"${response.name || ""}"`,
        `"${response.email || ""}"`,
        `"${response.contactNumber || ""}"`,
        `"${(response.feedback || "").replace(/"/g, '""')}"`,
        `"${response.marketing || ""}"`,
        `"${response["presenter-JaydenKok"] || ""}"`,
        `"${response["presenter-LeeWengFai"] || ""}"`,
        `"${response["session-app"] || ""}"`,
        `"${response["session-commercial"] || ""}"`,
        `"${response["session-installation"] || ""}"`,
        `"${response["session-residential"] || ""}"`,
        `"${formatTimestampForCSV(response.submitted)}"`,
        `"${response.userId || ""}"`,
        `"${response.eventLocationId || ""}"`,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `survey_responses_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export interface SurveyResponseFilterConfig {
  search: string;
  eventLocationId?: string;
}

export interface SurveyResponseSortConfig {
  key: keyof SurveyResponse | null;
  direction: "asc" | "desc";
}

export const searchAndSortSurveyResponses = (
  surveyResponses: SurveyResponse[],
  filter: SurveyResponseFilterConfig,
  sort: SurveyResponseSortConfig
): SurveyResponse[] => {
  let filteredResponses = surveyResponses.filter((response) => {
    // First filter by event location if specified
    if (
      filter.eventLocationId &&
      response.eventLocationId !== filter.eventLocationId
    ) {
      return false;
    }

    // Then filter by search term if provided
    if (!filter.search) return true;

    const searchTerm = filter.search.toLowerCase();

    return (
      response.name.toLowerCase().includes(searchTerm) ||
      response.email.toLowerCase().includes(searchTerm) ||
      response.contactNumber.includes(searchTerm) ||
      response.feedback.toLowerCase().includes(searchTerm)
    );
  });

  if (sort.key) {
    filteredResponses = [...filteredResponses].sort((a, b) => {
      const aValue = a[sort.key as keyof SurveyResponse];
      const bValue = b[sort.key as keyof SurveyResponse];

      // Handle numeric values
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sort.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sort.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }

  return filteredResponses;
};

// Helper function to format rating numbers into stars
export const formatRating = (rating: number): string => {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
};

export const formatMarketing = (answer: number): string =>
  answer === 1 ? "Yes" : "No";
