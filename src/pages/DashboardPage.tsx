import type React from "react";
import CustomerTable from "../components/customers/CustomerTable";

const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-10">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Attendee Management
          </h1>
          <p className="text-secondary-600 mt-1">
            View and manage all attendee information
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <CustomerTable />
      </div>
    </div>
  );
};

export default DashboardPage;
