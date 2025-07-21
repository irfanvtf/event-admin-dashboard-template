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
  FileDown,
} from "lucide-react";
import ClearCheckInModal from "../components/checkIn/ClearCheckInModal";
import { clearCheckInStatus, exportToCSV } from "../services/checkInService";
import { FilterConfig, locationOptions } from "../types";

interface Registration {
  id: string;
  customerType: string;
  dealerCompanyName?: string;
  emailAddress: string;
  fullName: string;
  idNumber: string;
  checkTimeStamp?: any;
  contactNumber: string;
  status?: string;
  locationId?: string;
}

interface SortConfig {
  key: keyof Registration | null;
  direction: "asc" | "desc";
}

const CheckInTablePage: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<
    Registration[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(
    undefined
  );
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [checkedInCount, setCheckedInCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Clear Check-in modal state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Registration | null>(
    null
  );
  const [isClearingCheckIn, setIsClearingCheckIn] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "fullName",
    direction: "asc",
  });

  // Add new function to calculate statistics
  const updateStatistics = (data: Registration[]) => {
    const locationFiltered = selectedLocation
      ? data.filter((reg) => reg.locationId === selectedLocation)
      : data;

    const total = locationFiltered.length;
    const checkedIn = locationFiltered.filter(
      (reg) => reg.status === "checked-in"
    ).length;

    setTotalCount(total);
    setCheckedInCount(checkedIn);
  };

  // Add new useEffect to update statistics when location changes
  useEffect(() => {
    updateStatistics(registrations);
  }, [selectedLocation, registrations]);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Handle opening the clear check-in modal
  const handleOpenClearModal = (registration: Registration) => {
    setSelectedCustomer(registration);
    setIsClearModalOpen(true);
    setClearSuccess(null);
  };

  // Handle closing the clear check-in modal
  const handleCloseClearModal = () => {
    setIsClearModalOpen(false);
    setSelectedCustomer(null);
  };

  // Handle confirming the clear check-in action
  const handleConfirmClear = async () => {
    if (!selectedCustomer) return;

    setIsClearingCheckIn(true);

    try {
      const success = await clearCheckInStatus(selectedCustomer.id);

      if (success) {
        // Update the local state
        const updatedRegistrations = registrations.map((reg) => {
          if (reg.id === selectedCustomer.id) {
            // Create a new object without status and checkTimeStamp
            const { status, checkTimeStamp, ...rest } = reg;
            return rest as Registration;
          }
          return reg;
        });

        setRegistrations(updatedRegistrations);

        // Update the filtered registrations as well
        setFilteredRegistrations((prev) =>
          prev.map((reg) => {
            if (reg.id === selectedCustomer.id) {
              const { status, checkTimeStamp, ...rest } = reg;
              return rest as Registration;
            }
            return reg;
          })
        );

        // Update the check-in count
        setCheckedInCount((prev) => prev - 1);

        // Show success message
        setClearSuccess(
          `Successfully cleared check-in status for ${selectedCustomer.fullName}`
        );

        // Close the modal after a delay
        setTimeout(() => {
          handleCloseClearModal();
        }, 2000);
      }
    } catch (error) {
      console.error("Error clearing check-in status:", error);
    } finally {
      setIsClearingCheckIn(false);
    }
  };

  useEffect(() => {
    if (registrations.length > 0) {
      const filtered = searchAndSortRegistrations(
        registrations,
        {
          search: searchTerm,
          status: statusFilter !== "all" ? statusFilter : undefined,
          locationId: selectedLocation || undefined,
        },
        sortConfig
      );
      setFilteredRegistrations(filtered);
    }
  }, [registrations, searchTerm, statusFilter, sortConfig, selectedLocation]);

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
      })) as Registration[];

      setRegistrations(registrationsData);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setError("Failed to fetch registrations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: keyof Registration) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const getSortIcon = (key: keyof Registration) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const searchAndSortRegistrations = (
    registrations: Registration[],
    filter: FilterConfig,
    sort: SortConfig
  ): Registration[] => {
    let filteredData = registrations.filter((registration) => {
      // Filter by status if specified
      if (filter.status && registration.status !== filter.status) {
        return false;
      }

      // Filter by locationId
      if (filter.locationId && registration.locationId !== filter.locationId) {
        return false;
      }

      // Filter by search term
      if (!filter.search) return true;

      const searchTerm = filter.search.toLowerCase();

      return (
        registration.fullName?.toLowerCase().includes(searchTerm) ||
        registration.emailAddress?.toLowerCase().includes(searchTerm) ||
        registration.idNumber?.includes(searchTerm) ||
        registration.contactNumber?.includes(searchTerm) ||
        registration.dealerCompanyName?.toLowerCase().includes(searchTerm)
      );
    });

    // Sort the filtered data
    if (sort.key) {
      filteredData = [...filteredData].sort((a, b) => {
        const aValue = a[sort.key as keyof Registration];
        const bValue = b[sort.key as keyof Registration];

        // Handle undefined values
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sort.direction === "asc" ? -1 : 1;
        if (bValue === undefined) return sort.direction === "asc" ? 1 : -1;

        // Handle timestamp objects
        if (sort.key === "checkTimeStamp") {
          const aTime =
            aValue && typeof aValue === "object" && "seconds" in aValue
              ? aValue.seconds
              : 0;
          const bTime =
            bValue && typeof bValue === "object" && "seconds" in bValue
              ? bValue.seconds
              : 0;

          return sort.direction === "asc" ? aTime - bTime : bTime - aTime;
        }

        // Handle string values
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sort.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        // Handle other values
        return sort.direction === "asc"
          ? aValue > bValue
            ? 1
            : -1
          : bValue > aValue
          ? 1
          : -1;
      });
    }

    return filteredData;
  };

  const formatDate = (timestamp: any) => {
    try {
      if (!timestamp) {
        return "Not checked in";
      }

      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Date not available";
    }
  };

  // Function to truncate text to a specific length with ellipsis
  const truncateText = (text: string | undefined, maxLength: number = 30) => {
    if (!text) return "-";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Clear Check-in Confirmation Modal */}
      <ClearCheckInModal
        isOpen={isClearModalOpen}
        onClose={handleCloseClearModal}
        onConfirm={handleConfirmClear}
        customerName={selectedCustomer?.fullName || ""}
        isLoading={isClearingCheckIn}
      />

      {/* Success Message */}
      {clearSuccess && (
        <div className="fixed top-4 right-4 bg-success-100 border border-success-200 text-success-800 px-4 py-3 rounded-md shadow-md z-50 animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-success-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{clearSuccess}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 animate-slide-up">
        <div className="flex justify-between items-center mt-10">
          <h1 className="text-2xl font-bold text-secondary-900">
            Check-In Records
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
            Check-In Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-secondary-50 p-4 rounded-md">
              <div className="text-secondary-500 text-sm">Total Registered</div>
              <div className="text-2xl font-bold text-secondary-900">
                {totalCount}
              </div>
            </div>
            <div className="bg-secondary-50 p-4 rounded-md">
              <div className="text-secondary-500 text-sm">Checked In</div>
              <div className="text-2xl font-bold text-success-600">
                {checkedInCount}
              </div>
            </div>
            <div className="bg-secondary-50 p-4 rounded-md">
              <div className="text-secondary-500 text-sm">Remaining</div>
              <div className="text-2xl font-bold text-primary-600">
                {totalCount - checkedInCount}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-secondary-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 py-2 w-full bg-secondary-50 h-10 border-[2px] border-secondary-200 rounded"
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="checked-in">Checked In</option>
              <option value="">Not Checked In</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToCSV(filteredRegistrations)}
              className="btn btn-secondary inline-flex items-center text-sm ml-2"
              disabled={isLoading || filteredRegistrations.length === 0}
              title="Export to CSV"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="table-container">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <div className="bg-danger-50 text-danger-700 p-4 rounded-lg inline-block">
                  <p className="font-medium">{error}</p>
                  <button
                    onClick={fetchRegistrations}
                    className="mt-4 btn btn-primary inline-flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </button>
                </div>
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="text-center py-16">
                <Info className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900">
                  No registrations found
                </h3>
                <p className="text-secondary-500 mt-1">
                  {searchTerm || statusFilter
                    ? "No results match your search criteria"
                    : "There are no registrations in the system yet."}
                </p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
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
                      onClick={() => handleSort("checkTimeStamp")}
                    >
                      <div className="flex items-center">
                        Check-in Time
                        {getSortIcon("checkTimeStamp")}
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
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon("status")}
                      </div>
                    </th>
                    <th className="text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
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
                          {formatDate(registration.checkTimeStamp)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-900">
                          {registration.contactNumber || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {registration.status === "checked-in" ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-100 text-success-800">
                              Checked In
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary-100 text-secondary-800">
                              Not Checked In
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {registration.status === "checked-in" && (
                            <button
                              onClick={() => handleOpenClearModal(registration)}
                              className="text-danger-600 hover:text-danger-800 transition-colors flex items-center text-xs"
                              title="Clear check-in status"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Clear
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInTablePage;
