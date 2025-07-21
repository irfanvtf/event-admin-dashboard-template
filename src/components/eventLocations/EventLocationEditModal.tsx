import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { EventLocation } from "../../types";

interface EventLocationEditModalProps {
  eventLocation: EventLocation | null;
  onClose: () => void;
  onSave: (eventLocation: EventLocation) => Promise<void>;
}

const EventLocationEditModal: React.FC<EventLocationEditModalProps> = ({
  eventLocation,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<EventLocation>>({
    location: "",
    date: "",
    time: "",
    venue: "",
    status: "upcoming",
    pos: 1,
    maxCapacity: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventLocation) {
      setFormData({
        location: eventLocation.location,
        date: eventLocation.date,
        time: eventLocation.time,
        venue: eventLocation.venue,
        status: eventLocation.status,
        pos: eventLocation.pos || 1,
        maxCapacity: eventLocation.maxCapacity || 250,
      });
    }
  }, [eventLocation]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventLocation) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        ...eventLocation,
        ...formData,
      } as EventLocation);

      onClose();
    } catch (err) {
      setError("Failed to save changes. Please try again.");
      console.error("Error saving event location:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!eventLocation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-secondary-900">
            Edit Event Location
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-secondary-100 text-secondary-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-danger-50 text-danger-700 p-3 rounded">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-input w-full bg-secondary-50 h-10 indent-2 border-[2px] border-secondary-200"
                required
              />
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Date
              </label>
              <input
                type="text"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-input w-full bg-secondary-50 h-10 indent-2 border-[2px] border-secondary-200"
                required
              />
            </div>

            <div>
              <label
                htmlFor="time"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Time
              </label>
              <input
                type="text"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="form-input w-full bg-secondary-50 h-10 indent-2 border-[2px] border-secondary-200"
                required
              />
            </div>

            <div>
              <label
                htmlFor="venue"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Venue
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                className="form-input w-full bg-secondary-50 h-10 indent-2 border-[2px] border-secondary-200"
                required
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select w-full bg-secondary-50 h-10 indent-2 border-[2px] border-secondary-200"
                required
              >
                <option value="upcoming">Upcoming</option>
                <option value="available">Available</option>
                <option value="closed">Closed</option>
                <option value="walk-in">Walk-in</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="pos"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Position (1 = top, ascending)
              </label>
              <input
                type="number"
                id="pos"
                name="pos"
                min="1"
                value={formData.pos}
                onChange={handleChange}
                className="form-input w-full bg-secondary-50 h-10 indent-2 border-[2px] border-secondary-200"
                required
              />
            </div>

            <div>
              <label
                htmlFor="maxCapacity"
                className="block text-sm font-medium text-secondary-700 mb-1"
              >
                Max Capacity
              </label>
              <input
                type="number"
                id="maxCapacity"
                name="maxCapacity"
                min="1"
                value={formData.maxCapacity}
                onChange={handleChange}
                className="form-input w-full bg-secondary-50 h-10 indent-2 border-[2px] border-secondary-200"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventLocationEditModal;
