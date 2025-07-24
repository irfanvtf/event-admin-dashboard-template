import React, { useEffect, useRef, useState } from "react";
import {
  QrCode,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Clock,
  RefreshCw,
} from "lucide-react";
import { processCheckIn } from "../services/checkInService";
import { Customer, locationOptions } from "../types";
import { appConfig } from "../config/config";

const CheckInPage: React.FC = () => {
  const [scanValue, setScanValue] = useState<string>("");
  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [lastCheckedInCustomer, setLastCheckedInCustomer] =
    useState<Customer | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qrPrefix = appConfig.qrPrefix;

  // Auto-focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Reset the focus to the input field after a scan
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scanStatus !== "idle" && inputRef.current) {
        setScanStatus("idle");
        setStatusMessage("");
        setScanValue("");
        inputRef.current.focus();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [scanStatus]);

  const handleScanInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();

    // Remove the prefix if it exists (to avoid double prefixes)
    if (value.startsWith(`${qrPrefix}-`)) {
      value = value.replace(new RegExp(`^${qrPrefix}`), "");
    }

    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, "");

    // Format as Malaysian IC: ######-##-####
    let formattedIC = "";
    if (digitsOnly.length > 0) {
      formattedIC = digitsOnly.slice(0, 6);
    }
    if (digitsOnly.length >= 7) {
      formattedIC += "-" + digitsOnly.slice(6, 8);
    }
    if (digitsOnly.length >= 9) {
      formattedIC += "-" + digitsOnly.slice(8, 12);
    }

    // Prepend the prefix
    const finalValue = `${qrPrefix}-${formattedIC}`;
    // Set the scan value directly without formatting or limiting characters

    setScanValue(finalValue);
  };

  // No need to fetch statistics here as they've been moved to the CheckInTablePage

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && scanValue && !processing) {
      try {
        setProcessing(true);

        // Process the QR code for check-in
        const result = await processCheckIn(scanValue);

        if (result.success) {
          setScanStatus("success");
          setStatusMessage(result.message);

          if (result.customer) {
            setLastCheckedInCustomer(result.customer);
            // No need to update check-in count here as it's now handled in the table page
          }
        } else {
          setScanStatus("error");
          setStatusMessage(result.message);
        }
      } catch (error) {
        console.error("Error processing check-in:", error);
        setScanStatus("error");
        setStatusMessage("An error occurred while processing the check-in");
      } finally {
        setProcessing(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <QrCode className="h-10 w-10 text-primary-500 mr-3" />
          <h1 className="text-2xl font-bold text-secondary-900">
            Event Check-In
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-secondary-800 mb-2">
              Scan QR Code
            </h2>
            <p className="text-secondary-600">
              Position the QR code in front of the scanner or enter the check-in
              code manually
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {processing ? (
                <div className="animate-spin">
                  <RefreshCw className="h-5 w-5 text-primary-500" />
                </div>
              ) : (
                <QrCode className="h-5 w-5 text-secondary-400" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={scanValue}
              onChange={handleScanInput}
              onKeyDown={handleKeyDown}
              placeholder={
                processing
                  ? "Processing check-in..."
                  : "Scan QR code or enter check-in code"
              }
              className={`form-input pl-10 py-3 w-full ${
                processing ? "bg-secondary-100" : "bg-secondary-50"
              } border-2 ${
                processing ? "border-primary-300" : "border-secondary-200"
              } rounded-md focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${
                processing ? "cursor-not-allowed" : ""
              }`}
              disabled={processing}
              autoFocus
            />
          </div>

          {scanStatus === "success" && (
            <div className="bg-success-50 border border-success-200 rounded-md p-4 flex items-center mb-4">
              <CheckCircle className="h-5 w-5 text-success-500 mr-2 flex-shrink-0" />
              <span className="text-success-700">{statusMessage}</span>
            </div>
          )}

          {scanStatus === "error" && (
            <div className="bg-danger-50 border border-danger-200 rounded-md p-4 flex items-center mb-4">
              <AlertCircle className="h-5 w-5 text-danger-500 mr-2 flex-shrink-0" />
              <span className="text-danger-700">{statusMessage}</span>
            </div>
          )}

          <div className="bg-secondary-50 rounded-md p-4">
            <h3 className="text-sm font-medium text-secondary-700 mb-2">
              Instructions:
            </h3>
            <ol className="list-decimal pl-5 text-sm text-secondary-600 space-y-1">
              <li>There will a short delay before the check-in is processed</li>
              <li>Please only scan the QR code once</li>
              <li>Ensure the QR code scanner is connected and working</li>
              <li>Position the attendee's QR code in front of the scanner</li>
              <li>The system will automatically process the check-in</li>
              <li>A confirmation message will appear when successful</li>
              <li>The scanner will be ready for the next attendee</li>
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {lastCheckedInCustomer && (
            <div>
              <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
                <UserCheck className="h-5 w-5 text-success-500 mr-2" />
                Last Checked-In Attendee
              </h3>
              <div className="bg-success-50 p-4 rounded-md">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center">
                    <span className="text-secondary-500 text-sm w-24">
                      Name:
                    </span>
                    <span className="text-secondary-900 font-medium">
                      {lastCheckedInCustomer.fullName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-secondary-500 text-sm w-24">
                      ID Number:
                    </span>
                    <span className="text-secondary-900">
                      {lastCheckedInCustomer.idNumber}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-secondary-500 text-sm w-24">
                      Check-In Time:
                    </span>
                    <span className="text-secondary-900 flex items-center">
                      <Clock className="h-4 w-4 text-secondary-500 mr-1" />
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-secondary-500 text-sm w-24">
                      T-Shirt Size:
                    </span>
                    <span className="text-secondary-900">
                      {lastCheckedInCustomer.tshirtSize}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-secondary-500 text-sm w-24">
                      Location:
                    </span>
                    <span className="text-secondary-900">
                      {
                        locationOptions.find(
                          (location) =>
                            location.id === lastCheckedInCustomer.locationId
                        )?.name
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;
