import React, { useEffect, useRef, useState } from "react";
import {
  QrCode,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Clock,
  RefreshCw,
  Gift,
} from "lucide-react";
import { processGiftRedemption } from "../services/giftRedemptionService";
import { Customer, locationOptions } from "../types";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../services/firebase";
import { appConfig } from "../config/config";

const GiftRedemptionPage: React.FC = () => {
  const [scanValue, setScanValue] = useState<string>("");
  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [lastRedeemedCustomer, setLastRedeemedCustomer] =
    useState<Customer | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [redeemedCount, setRedeemedCount] = useState<number>(0);
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(
    undefined
  );
  const [registrations, setRegistrations] = useState<Customer[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const qrPrefix = appConfig.qrPrefix;

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

  // Update statistics when location or registrations change
  useEffect(() => {
    updateStatistics(registrations);
  }, [selectedLocation, registrations]);

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
      value = value.replace(new RegExp(`^${qrPrefix}-`), "");
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
    setScanValue(finalValue);
  };

  // Fetch redemption statistics when the component mounts
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        // Fetch real statistics from Firestore
        const registrationsRef = collection(db, "registrations");
        const q = query(registrationsRef);
        const querySnapshot = await getDocs(q);

        const registrationsData = querySnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        })) as Customer[];

        setRegistrations(registrationsData);
      } catch (error) {
        console.error("Error fetching gift redemption statistics:", error);
      }
    };

    fetchStatistics();
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && scanValue && !processing) {
      try {
        setProcessing(true);

        // Process the QR code for gift redemption
        const result = await processGiftRedemption(scanValue);

        if (result.success) {
          setScanStatus("success");
          setStatusMessage(result.message);

          if (result.customer) {
            setLastRedeemedCustomer(result.customer);
            // Update the registrations data to reflect the new redemption
            setRegistrations((prev) =>
              prev.map((reg) =>
                reg.id === result.customer?.id
                  ? { ...reg, redeemedGift: true }
                  : reg
              )
            );
          }
        } else {
          setScanStatus("error");
          setStatusMessage(result.message);
        }
      } catch (error) {
        console.error("Error processing gift redemption:", error);
        setScanStatus("error");
        setStatusMessage(
          "An error occurred while processing the gift redemption"
        );
      } finally {
        setProcessing(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Gift className="h-10 w-10 text-primary-500 mr-3" />
            <h1 className="text-2xl font-bold text-secondary-900">
              Gift Redemption
            </h1>
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
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-secondary-800 mb-2">
              Scan QR Code
            </h2>
            <p className="text-secondary-600">
              Position the QR code in front of the scanner to redeem the
              attendee's gift
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
                  ? "Processing redemption..."
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
              <li>
                There will a short delay before the redemption is processed
              </li>
              <li>Please only scan the QR code once</li>
              <li>Ensure the QR code scanner is connected and working</li>
              <li>Position the attendee's QR code in front of the scanner</li>
              <li>The system will automatically process the gift redemption</li>
              <li>A confirmation message will appear when successful</li>
              <li>The scanner will be ready for the next attendee</li>
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

          {lastRedeemedCustomer && (
            <div>
              <h3 className="text-lg font-semibold text-secondary-800 mb-3 flex items-center">
                <Gift className="h-5 w-5 text-success-500 mr-2" />
                Last Gift Redeemed
              </h3>
              <div className="bg-success-50 p-4 rounded-md">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center">
                    <span className="text-secondary-500 text-sm w-24">
                      Name:
                    </span>
                    <span className="text-secondary-900 font-medium">
                      {lastRedeemedCustomer.fullName}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-secondary-500 text-sm w-24">
                      ID Number:
                    </span>
                    <span className="text-secondary-900">
                      {lastRedeemedCustomer.idNumber}
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
                            location.id === lastRedeemedCustomer.locationId
                        )?.name
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-secondary-500 text-sm w-24">
                      Redemption Time:
                    </span>
                    <span className="text-secondary-900 flex items-center">
                      <Clock className="h-4 w-4 text-secondary-500 mr-1" />
                      {new Date().toLocaleTimeString()}
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

export default GiftRedemptionPage;
