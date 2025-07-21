import { db } from "./firebase";
import {
  collection,
  query,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import {
  EventLocation,
  EventLocationSortConfig,
  EventLocationFilterConfig,
} from "../types";

export const getEventLocations = async (): Promise<EventLocation[]> => {
  try {
    const eventLocationsRef = collection(db, "eventLocation");
    const q = query(eventLocationsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EventLocation[];
  } catch (error) {
    console.error("Error fetching event locations:", error);
    throw error;
  }
};

export const deleteEventLocation = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "eventLocation", id));
  } catch (error) {
    console.error("Error deleting event location:", error);
    throw error;
  }
};

export const updateEventLocation = async (
  id: string,
  data: Partial<EventLocation>
): Promise<void> => {
  try {
    const eventLocationRef = doc(db, "eventLocation", id);
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(eventLocationRef, updatedData);
  } catch (error) {
    console.error("Error updating event location:", error);
    throw error;
  }
};

export const exportToCSV = (eventLocations: EventLocation[]): void => {
  const headers = ["Location", "Date", "Time", "Venue", "Status", "Created At"];

  const csvContent = [
    headers.join(","),
    ...eventLocations.map((location) =>
      [
        `"${location.location}"`,
        `"${location.date}"`,
        `"${location.time}"`,
        `"${location.venue}"`,
        `"${location.status}"`,
        `"${new Date(location.createdAt).toLocaleString()}"`,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `event_locations_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const searchAndSortEventLocations = (
  eventLocations: EventLocation[],
  filter: EventLocationFilterConfig,
  sort: EventLocationSortConfig
): EventLocation[] => {
  let filteredLocations = eventLocations.filter((location) => {
    // Filter by search term
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      if (
        !location.location.toLowerCase().includes(searchTerm) &&
        !location.venue.toLowerCase().includes(searchTerm) &&
        !location.date.toLowerCase().includes(searchTerm)
      ) {
        return false;
      }
    }

    // Filter by status if specified
    if (filter.status && location.status !== filter.status) {
      return false;
    }

    return true;
  });

  if (sort.key) {
    filteredLocations = [...filteredLocations].sort((a, b) => {
      const aValue = a[sort.key as keyof EventLocation];
      const bValue = b[sort.key as keyof EventLocation];

      // Handle numeric values (like position)
      if (sort.key === "pos") {
        const aPos = typeof aValue === "number" ? aValue : 9999;
        const bPos = typeof bValue === "number" ? bValue : 9999;

        return sort.direction === "asc" ? aPos - bPos : bPos - aPos;
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

  return filteredLocations;
};

export const getStatusColor = (status: EventLocation["status"]): string => {
  switch (status) {
    case "upcoming":
      return "bg-blue-100 text-blue-800";
    case "available":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-gray-100 text-gray-800";
    case "walk-in":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

type EventLocationData = {
  location: string;
  date: string;
  time: string;
  venue: string;
  status: "upcoming" | "available" | "closed" | "walk-in";
  maxCapacity?: number;
};

export const uploadEventLocations = async (
  eventLocations: EventLocationData[]
): Promise<{ success: boolean; message: string }> => {
  try {
    const eventLocationsRef = collection(db, "eventLocation");
    const timestamp = new Date();

    // Add each event location to the collection
    const promises = eventLocations.map((location) => {
      return addDoc(eventLocationsRef, {
        ...location,
        createdAt: timestamp.toISOString(),
        updatedAt: timestamp.toISOString(),
      });
    });

    await Promise.all(promises);

    return {
      success: true,
      message: `Successfully uploaded ${eventLocations.length} event locations.`,
    };
  } catch (error) {
    console.error("Error uploading event locations:", error);
    return {
      success: false,
      message: `Failed to upload event locations: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};
