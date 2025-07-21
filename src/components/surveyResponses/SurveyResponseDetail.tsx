import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SurveyResponse, EventLocation } from "../../types";
import {
  formatMarketing,
  formatRating,
} from "../../services/surveyResponseService";
import { getEventLocations } from "../../services/eventLocationService";

interface SurveyResponseDetailProps {
  surveyResponse: SurveyResponse;
  onClose: () => void;
}

const SurveyResponseDetail: React.FC<SurveyResponseDetailProps> = ({
  surveyResponse,
  onClose,
}) => {
  // State to store event location data
  const [eventLocation, setEventLocation] = useState<EventLocation | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // Fetch event location data when component mounts
  useEffect(() => {
    const fetchEventLocation = async () => {
      try {
        if (surveyResponse.eventLocationId) {
          setLoading(true);
          const locations = await getEventLocations();
          const matchingLocation = locations.find(
            (loc) => loc.id === surveyResponse.eventLocationId
          );
          setEventLocation(matchingLocation || null);
        }
      } catch (error) {
        console.error("Error fetching event location:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventLocation();
  }, [surveyResponse.eventLocationId]);

  // Format date from timestamp
  const formatDate = (timestamp: any) => {
    try {
      // Check if it's a Firestore timestamp object with seconds and nanoseconds
      if (
        timestamp &&
        typeof timestamp === "object" &&
        "seconds" in timestamp
      ) {
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

      // If all else fails, return a placeholder
      return "Date not available";
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Date not available";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 animate-fade-in overflow-y-auto max-h-[90vh]">
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-6 border-b border-secondary-200 pb-4">
          <div>
            <h3 className="text-xl font-bold text-secondary-900">
              Survey Response Details
            </h3>
            <p className="text-secondary-500 text-sm mt-1">
              Submitted: {formatDate(surveyResponse.submitted)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary-100 text-secondary-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Respondent Information Card */}
          <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
            <h4 className="text-md font-semibold text-secondary-900 mb-3 flex items-center">
              <span className="bg-primary-100 text-primary-700 p-1 rounded mr-2">
                👤
              </span>
              Respondent Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-secondary-500">
                    Name
                  </span>
                  <span className="text-secondary-900 font-medium">
                    {surveyResponse.name}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-secondary-500">
                    Email
                  </span>
                  <span className="text-secondary-900">
                    {surveyResponse.email}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-secondary-500">
                    Contact Number
                  </span>
                  <span className="text-secondary-900">
                    {surveyResponse.contactNumber}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-secondary-500">
                    User ID
                  </span>
                  <span className="text-secondary-900 text-xs break-all">
                    {surveyResponse.userId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ratings Card */}
          <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
            <h4 className="text-md font-semibold text-secondary-900 mb-3 flex items-center">
              <span className="bg-primary-100 text-primary-700 p-1 rounded mr-2">
                ⭐
              </span>
              Ratings
            </h4>

            {/* Marketing Rating */}
            <div className="mb-4 pb-4 border-b border-secondary-200">
              <h5 className="text-sm font-medium text-secondary-700 mb-2">
                Marketing
              </h5>
              <div className="flex items-center">
                <div
                  className={`text-l font-semibold ${
                    surveyResponse.marketing === 1
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {formatMarketing(surveyResponse.marketing)}
                </div>
              </div>
            </div>

            {/* Session Ratings */}
            <div className="mb-4 pb-4 border-b border-secondary-200">
              <h5 className="text-sm font-medium text-secondary-700 mb-2">
                Session Ratings
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-secondary-500">App</span>
                  <div className="flex items-center">
                    <div className="text-yellow-500">
                      {formatRating(surveyResponse["session-app"])}
                    </div>
                    <span className="ml-2 text-secondary-600 text-xs">
                      {surveyResponse["session-app"]}/5
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-secondary-500">Commercial</span>
                  <div className="flex items-center">
                    <div className="text-yellow-500">
                      {formatRating(surveyResponse["session-commercial"])}
                    </div>
                    <span className="ml-2 text-secondary-600 text-xs">
                      {surveyResponse["session-commercial"]}/5
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-secondary-500">
                    Installation
                  </span>
                  <div className="flex items-center">
                    <div className="text-yellow-500">
                      {formatRating(surveyResponse["session-installation"])}
                    </div>
                    <span className="ml-2 text-secondary-600 text-xs">
                      {surveyResponse["session-installation"]}/5
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-secondary-500">
                    Residential
                  </span>
                  <div className="flex items-center">
                    <div className="text-yellow-500">
                      {formatRating(surveyResponse["session-residential"])}
                    </div>
                    <span className="ml-2 text-secondary-600 text-xs">
                      {surveyResponse["session-residential"]}/5
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Presenter Ratings */}
            <div>
              <h5 className="text-sm font-medium text-secondary-700 mb-2">
                Presenter Ratings
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-secondary-500">Jayden Kok</span>
                  <div className="flex items-center">
                    <div className="text-yellow-500">
                      {formatRating(surveyResponse["presenter-JaydenKok"])}
                    </div>
                    <span className="ml-2 text-secondary-600 text-xs">
                      {surveyResponse["presenter-JaydenKok"]}/5
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-secondary-500">
                    Lee Weng Fai
                  </span>
                  <div className="flex items-center">
                    <div className="text-yellow-500">
                      {formatRating(surveyResponse["presenter-LeeWengFai"])}
                    </div>
                    <span className="ml-2 text-secondary-600 text-xs">
                      {surveyResponse["presenter-LeeWengFai"]}/5
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Card */}
          <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
            <h4 className="text-md font-semibold text-secondary-900 mb-3 flex items-center">
              <span className="bg-primary-100 text-primary-700 p-1 rounded mr-2">
                💬
              </span>
              Feedback
            </h4>
            <div className="p-3 bg-white rounded-md border border-secondary-200">
              <p className="text-secondary-900 whitespace-pre-wrap">
                {surveyResponse.feedback || "No feedback provided."}
              </p>
            </div>
          </div>

          {/* Event Information */}
          <div className="bg-secondary-50 rounded-lg p-4 border border-secondary-200">
            <h4 className="text-md font-semibold text-secondary-900 mb-3 flex items-center">
              <span className="bg-primary-100 text-primary-700 p-1 rounded mr-2">
                📍
              </span>
              Event Information
            </h4>
            <div className="space-y-3">
              {loading ? (
                <div className="text-secondary-500 text-sm">
                  Loading event location...
                </div>
              ) : eventLocation ? (
                <>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-secondary-500">
                      Location
                    </span>
                    <span className="text-secondary-900 font-medium">
                      {eventLocation.location}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-secondary-500">
                        Date
                      </span>
                      <span className="text-secondary-900">
                        {eventLocation.date}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-secondary-500">
                        Time
                      </span>
                      <span className="text-secondary-900">
                        {eventLocation.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-secondary-500">
                      Venue
                    </span>
                    <span className="text-secondary-900">
                      {eventLocation.venue}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-secondary-500">
                      Status
                    </span>
                    <span className="text-secondary-900 capitalize">
                      {eventLocation.status}
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-secondary-500">
                      Event Location ID
                    </span>
                    <span className="text-secondary-900 text-xs break-all">
                      {surveyResponse.eventLocationId}
                    </span>
                  </div>
                  <div className="text-secondary-500 text-sm italic">
                    Event location details not found
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end pt-4 border-t border-secondary-200">
          <button onClick={onClose} className="btn btn-primary px-6">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyResponseDetail;
