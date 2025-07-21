export interface Customer {
  id: string;
  appDownloaded: boolean;
  contactNumber: string;
  createdAt: string;
  customerType: string;
  dealerCompanyName: string;
  emailAddress: string;
  fullName: string;
  idNumber: string;
  idType: string;
  tshirtSize: string;
  updatedAt: string;
  status?: string;
  checkTimeStamp?: any;
  redeemedGift?: boolean;
  redemptionTimeStamp?: any;
  locationId?: string;
}

export const locationOptions = [
  { id: "TDLCwoOZ6fg7OMy4qmc2", name: "Melaka" },
  { id: "6x2Sf3zwlm4LCPHrL3WR", name: "Kuala Terengganu" },
  { id: "XjGsSKAoBVQAbPxNuT54", name: "Kelantan" },
  { id: "5PhUT9g47fAjr2WQ5gjW", name: "Kluang" },
  { id: "kDASe0AIGebq1t8VVQzS", name: "Taiping" },
];

export interface EventLocation {
  id: string;
  location: string;
  date: string;
  time: string;
  venue: string;
  status: "upcoming" | "available" | "closed" | "walk-in";
  pos: number; // Position for ordering (1 = top, ascending)
  maxCapacity?: number; // Maximum capacity for the event location
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  id: string;
  contactNumber: string;
  email: string;
  eventLocationId: string;
  feedback: string;
  marketing: number;
  name: string;
  "presenter-JaydenKok": number;
  "presenter-LeeWengFai": number;
  "session-app": number;
  "session-commercial": number;
  "session-installation": number;
  "session-residential": number;
  submitted: string; // Timestamp string
  userId: string;
}

export interface User {
  username: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  key: keyof Customer | null;
  direction: SortDirection;
}

export interface EventLocationSortConfig {
  key: keyof EventLocation | null;
  direction: SortDirection;
}

export interface FilterConfig {
  search: string;
  status?: string;
  locationId?: string;
}

export interface EventLocationFilterConfig {
  search: string;
  status?: "upcoming" | "available" | "closed" | "walk-in";
}
