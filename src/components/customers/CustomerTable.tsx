"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  Info,
  RefreshCw,
  Trash2,
  FileDown,
} from "lucide-react";
import {
  type Customer,
  type SortConfig,
  type FilterConfig,
  locationOptions,
} from "../../types";
import {
  getCustomers,
  searchAndSortCustomers,
  deleteCustomer,
  exportToCSV,
} from "../../services/customerService";
import { formatDate, formatBoolean } from "../../utils/formatters";
import CustomerSearch from "./CustomerSearch";

const CustomerTable: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "createdAt",
    direction: "desc",
  });

  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    search: "",
    locationId: "",
  });

  // FIXME: is this used?
  const locationMap = useMemo(() => {
    const map: Record<string, string> = {};
    locationOptions.forEach((loc) => {
      map[loc.id] = loc.name;
    });
    return map;
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (customers.length > 0) {
      const sorted = searchAndSortCustomers(
        customers,
        filterConfig,
        sortConfig
      );
      setFilteredCustomers(sorted);
    }
  }, [customers, sortConfig, filterConfig]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getCustomers();
      setCustomers(data);
      setFilteredCustomers(
        searchAndSortCustomers(data, filterConfig, sortConfig)
      );
    } catch (err) {
      setError("Failed to load customer data. Please try again.");
      console.error("Error fetching customers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;

    try {
      await deleteCustomer(customerToDelete.id);
      setCustomers(customers.filter((c) => c.id !== customerToDelete.id));
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (err) {
      setError("Failed to delete customer. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCustomerToDelete(null);
  };

  const handleSort = (key: keyof Customer) => {
    let direction: "asc" | "desc" = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Customer) => {
    if (sortConfig.key !== key) {
      return null;
    }

    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  const handleSearch = (term: string) => {
    setFilterConfig({ ...filterConfig, search: term });
  };

  const handleLocationFilter = (locationId: string | undefined) => {
    setFilterConfig({ ...filterConfig, locationId });
  };

  const handleExport = () => {
    exportToCSV(filteredCustomers);
  };

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="bg-danger-50 text-danger-700 p-4 rounded-lg inline-block">
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchCustomers}
            className="mt-4 btn btn-primary inline-flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 animate-slide-up relative z-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <CustomerSearch
              searchTerm={filterConfig.search}
              setSearchTerm={handleSearch}
              selectedLocation={filterConfig.locationId}
              setSelectedLocation={handleLocationFilter}
            />

            <div className="flex items-center gap-2">
              <div className="text-sm text-secondary-600">
                Total Customers:{" "}
                <span className="font-bold">{customers.length}</span>
                {(filterConfig.search || filterConfig.locationId) && (
                  <span className="ml-2">
                    (Filtered:{" "}
                    <span className="font-bold">
                      {filteredCustomers.length}
                    </span>
                    )
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="btn btn-secondary inline-flex items-center text-sm"
              disabled={filteredCustomers.length === 0}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export CSV
            </button>

            <button
              onClick={fetchCustomers}
              className="btn btn-secondary inline-flex items-center text-sm"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <div className="table-container">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-16">
                  <Info className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-secondary-900">
                    No customers found
                  </h3>
                  <p className="text-secondary-500 mt-1">
                    {filterConfig.search
                      ? `No results match "${filterConfig.search}"`
                      : "There are no customers in the system yet."}
                  </p>
                </div>
              ) : (
                <table className="data-table w-full table-auto">
                  <thead>
                    <tr>
                      <th className="w-12 text-center">#</th>
                      <th
                        className="cursor-pointer"
                        onClick={() => handleSort("fullName")}
                      >
                        <div className="flex items-center">
                          Full Name
                          {getSortIcon("fullName")}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer max-w-48"
                        onClick={() => handleSort("emailAddress")}
                      >
                        <div className="flex items-center">
                          Email
                          {getSortIcon("emailAddress")}
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
                        onClick={() => handleSort("customerType")}
                      >
                        <div className="flex items-center">
                          Type
                          {getSortIcon("customerType")}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer"
                        onClick={() => handleSort("idType")}
                      >
                        <div className="flex items-center">
                          ID Type
                          {getSortIcon("idType")}
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
                        onClick={() => handleSort("appDownloaded")}
                      >
                        <div className="flex items-center">
                          App
                          {getSortIcon("appDownloaded")}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer"
                        onClick={() => handleSort("tshirtSize")}
                      >
                        <div className="flex items-center">
                          T-Shirt
                          {getSortIcon("tshirtSize")}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer"
                        onClick={() => handleSort("locationId")}
                      >
                        <div className="flex items-center">
                          Location
                          {getSortIcon("locationId")}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center">
                          Created
                          {getSortIcon("createdAt")}
                        </div>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer, index) => (
                      <tr
                        key={customer.id}
                        className="hover:bg-secondary-50 transition-colors"
                      >
                        <td className="text-center text-secondary-500">
                          {index + 1}
                        </td>
                        <td className="font-medium">{customer.fullName}</td>
                        <td
                          className="max-w-48 truncate"
                          title={customer.emailAddress}
                        >
                          {customer.emailAddress}
                        </td>
                        <td>{customer.contactNumber}</td>
                        <td>
                          <span
                            className={`badge ${
                              customer.customerType === "dealer"
                                ? "badge-info"
                                : "badge-success"
                            }`}
                          >
                            {customer.customerType}
                          </span>
                          {customer.customerType === "dealer" && (
                            <div className="text-xs text-secondary-500 mt-1">
                              {customer.dealerCompanyName}
                            </div>
                          )}
                        </td>
                        <td>{customer.idType}</td>
                        <td>{customer.idNumber}</td>
                        <td>
                          <span
                            className={`badge ${
                              customer.appDownloaded
                                ? "badge-success"
                                : "badge-warning"
                            }`}
                          >
                            {formatBoolean(customer.appDownloaded)}
                          </span>
                        </td>
                        <td className="text-center">{customer.tshirtSize}</td>
                        <td>
                          {customer.locationId
                            ? locationMap[customer.locationId] ?? "—"
                            : "—"}
                        </td>
                        <td className="text-sm text-secondary-500">
                          {formatDate(customer.createdAt)}
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteClick(customer)}
                            className="text-secondary-400 hover:text-danger-600 transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && customerToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={handleDeleteCancel}
          />
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl relative">
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              Confirm Delete
            </h3>
            <p className="text-secondary-600 mb-4">
              Are you sure you want to delete the customer{" "}
              <span className="font-medium">{customerToDelete.fullName}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerTable;
