import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import {
  Search,
  RefreshCw,
  Info,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RotateCw,
  FileDown,
} from "lucide-react";
import { Customer, locationOptions } from "../types";
import ClearRedemptionModal from "../components/giftRedemption/ClearRedemptionModal";
import {
  clearGiftRedemptionStatus,
  exportToCSV,
} from "../services/giftRedemptionService";

interface GiftRedemptionTableProps {}

type SortDirection = "asc" | "desc";

interface SortConfig {
  key: keyof Customer | "";
  direction: SortDirection;
}

const GiftRedemptionTablePage: React.FC<GiftRedemptionTableProps> = () => {
  const [registrations, setRegistrations] = useState<Customer[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<
    Customer[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(
    undefined
  );
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [totalCount, setTotalCount] = useState<number>(0);
  const [redeemedCount, setRedeemedCount] = useState<number>(0);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "fullName",
    direction: "asc",
  });

  // Clear redemption modal state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isClearingRedemption, setIsClearingRedemption] = useState(false);

  // Add new function to calculate statistics
  const updateStatistics = (data: Customer[]) => {
    const locationFiltered = selectedLocation
      ? data.filter((reg) => reg.locationId === selectedLocation)
      : data;

    const total = locationFiltered.length;
    const redeemed = locationFiltered.filter(
      (reg) => reg.redeemedGift === true
    ).length;

    setTotalCount(total);
    setRedeemedCount(redeemed);
  };

  // Add new useEffect to update statistics when location changes
  useEffect(() => {
    updateStatistics(registrations);
  }, [selectedLocation, registrations]);

  // Fetch registrations data
  const fetchRegistrations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const registrationsRef = collection(db, "registrations");
      const q = query(registrationsRef, orderBy("fullName", "asc"));
      const querySnapshot = await getDocs(q);

      const registrationsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];

      setRegistrations(registrationsData);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setError("Failed to fetch registrations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    applyFilters(registrations);
  }, [registrations, searchTerm, statusFilter, sortConfig, selectedLocation]);

  const handleSort = (key: keyof Customer) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setStatusFilter(e.target.value);
  };

  const getSortIcon = (key: keyof Customer) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const formatDate = (timestamp: any) => {
    try {
      if (!timestamp) {
        return "Not redeemed";
      }

      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Date not available";
    }
  };

  // Function to truncate text to a specific length with ellipsis
  const truncateText = (
    text: string | undefined,
    maxLength: number = 20
  ): string => {
    if (!text) return "-";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  // Handle opening the clear redemption modal
  const handleOpenClearModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsClearModalOpen(true);
  };

  // Function to apply filters to registrations data
  const applyFilters = (data: Customer[]) => {
    if (data.length > 0) {
      let filtered = [...data];

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (reg) =>
            (reg.fullName &&
              reg.fullName.toLowerCase().includes(searchLower)) ||
            (reg.emailAddress &&
              reg.emailAddress.toLowerCase().includes(searchLower)) ||
            (reg.idNumber &&
              reg.idNumber.toLowerCase().includes(searchLower)) ||
            (reg.dealerCompanyName &&
              reg.dealerCompanyName.toLowerCase().includes(searchLower))
        );
      }

      // Apply status filter
      if (statusFilter) {
        if (statusFilter === "redeemed") {
          filtered = filtered.filter((reg) => reg.redeemedGift === true);
        } else if (statusFilter === "not-redeemed") {
          filtered = filtered.filter((reg) => reg.redeemedGift !== true);
        }
      }

      // Apply location filter
      if (selectedLocation) {
        filtered = filtered.filter(
          (reg) => reg.locationId === selectedLocation
        );
      }

      // Apply sorting
      if (sortConfig.key) {
        filtered.sort((a, b) => {
          const aValue = a[sortConfig.key as keyof Customer];
          const bValue = b[sortConfig.key as keyof Customer];

          if (aValue === undefined && bValue === undefined) return 0;
          if (aValue === undefined)
            return sortConfig.direction === "asc" ? 1 : -1;
          if (bValue === undefined)
            return sortConfig.direction === "asc" ? -1 : 1;

          if (typeof aValue === "string" && typeof bValue === "string") {
            return sortConfig.direction === "asc"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }

          return sortConfig.direction === "asc"
            ? aValue < bValue
              ? -1
              : 1
            : bValue < aValue
            ? -1
            : 1;
        });
      }

      setFilteredRegistrations(filtered);
    } else {
      setFilteredRegistrations([]);
    }
  };

  // Handle clearing redemption status
  const handleClearRedemption = async () => {
    if (!selectedCustomer) return;

    setIsClearingRedemption(true);

    try {
      const success = await clearGiftRedemptionStatus(selectedCustomer.id);

      if (success) {
        // Update the local state to reflect the change
        const updatedRegistrations = registrations.map((reg) => {
          if (reg.id === selectedCustomer.id) {
            return {
              ...reg,
              redeemedGift: false,
              redemptionTimeStamp: undefined,
            };
          }
          return reg;
        });

        setRegistrations(updatedRegistrations);

        // Update filtered registrations and counts
        applyFilters(updatedRegistrations);
        setRedeemedCount((prev) => prev - 1);
      }

      // Close the modal
      setIsClearModalOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error("Error clearing redemption status:", error);
    } finally {
      setIsClearingRedemption(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Clear Redemption Modal */}
      <ClearRedemptionModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearRedemption}
        customerName={selectedCustomer?.fullName || ""}
        isLoading={isClearingRedemption}
      />

      <div className="space-y-4 animate-slide-up">
        <div className="flex justify-between items-center mt-10">
          <h1 className="text-2xl font-bold text-secondary-900">
            Gift Redemption Records
          </h1>
          <button
            onClick={fetchRegistrations}
            className="btn btn-primary inline-flex items-center text-sm"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-xl font-semibold text-secondary-800 mb-4">
            Gift Redemption Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-secondary-50 p-4 rounded-md">
              <div className="text-secondary-500 text-sm">Total Registered</div>
              <div className="text-2xl font-bold text-secondary-900">
                {totalCount}
              </div>
            </div>
            <div className="bg-secondary-50 p-4 rounded-md">
              <div className="text-secondary-500 text-sm">Gifts Redeemed</div>
              <div className="text-2xl font-bold text-success-600">
                {redeemedCount}
              </div>
            </div>
            <div className="bg-secondary-50 p-4 rounded-md">
              <div className="text-secondary-500 text-sm">Remaining</div>
              <div className="text-2xl font-bold text-primary-600">
                {totalCount - redeemedCount}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-secondary-400" />
              </div>
              <input
                type="text"
                placeholder="Search registrations..."
                className="pl-10 pr-4 py-2 w-full border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            <div>
              <select
                value={selectedLocation || ""}
                onChange={(e) =>
                  setSelectedLocation(
                    e.target.value === "" ? undefined : e.target.value
                  )
                }
                className="w-full md:w-auto px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All location</option>
                {locationOptions.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full md:w-auto px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="redeemed">Redeemed</option>
              <option value="not-redeemed">Not Redeemed</option>
            </select>
          </div>

          <div className="w-full md:w-auto">
            <button
              onClick={() => exportToCSV(filteredRegistrations)}
              className="btn btn-secondary inline-flex items-center text-sm"
              disabled={isLoading || filteredRegistrations.length === 0}
              title="Export to CSV"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {error ? (
            <div className="p-4 text-danger-700 bg-danger-50 border-l-4 border-danger-500">
              <div className="flex">
                <Info className="h-5 w-5 text-danger-500 mr-2" />
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="w-12 text-center">#</th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("dealerCompanyName")}
                    >
                      <div className="flex items-center">
                        Company
                        {getSortIcon("dealerCompanyName")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("fullName")}
                    >
                      <div className="flex items-center">
                        Name
                        {getSortIcon("fullName")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("idNumber")}
                    >
                      <div className="flex items-center">
                        ID Number
                        {getSortIcon("idNumber")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("redemptionTimeStamp")}
                    >
                      <div className="flex items-center">
                        Redemption Time
                        {getSortIcon("redemptionTimeStamp")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("contactNumber")}
                    >
                      <div className="flex items-center">
                        Contact
                        {getSortIcon("contactNumber")}
                      </div>
                    </th>
                    <th
                      className="cursor-pointer"
                      onClick={() => handleSort("redeemedGift")}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon("redeemedGift")}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-secondary-500"
                      >
                        {isLoading ? (
                          <div className="flex justify-center items-center">
                            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                            Loading registrations...
                          </div>
                        ) : (
                          "No registrations found"
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((registration, index) => (
                      <tr
                        key={registration.id}
                        className="hover:bg-secondary-50"
                      >
                        <td className="text-center">{index + 1}</td>
                        <td
                          className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900"
                          title={registration.dealerCompanyName || ""}
                        >
                          {truncateText(registration.dealerCompanyName)}
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900 font-medium"
                          title={registration.fullName || ""}
                        >
                          {truncateText(registration.fullName)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900">
                          {registration.idNumber || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900">
                          {formatDate(registration.redemptionTimeStamp)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900">
                          {registration.contactNumber || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {registration.redeemedGift ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-100 text-success-800">
                              Redeemed
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary-100 text-secondary-800">
                              Not Redeemed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {registration.redeemedGift && (
                            <button
                              onClick={() => handleOpenClearModal(registration)}
                              className="text-danger-600 hover:text-danger-800 transition-colors inline-flex items-center"
                              title="Clear redemption status"
                            >
                              <RotateCw className="h-4 w-4 mr-1" />
                              Clear
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftRedemptionTablePage;
