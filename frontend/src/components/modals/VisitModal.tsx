import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import type { ParticipantVisit } from '../../types';

interface VisitModalProps {
  visit: ParticipantVisit;
  onClose: () => void;
  onComplete: (visitId: number, data: { actual_date: string; status: string; notes?: string }) => Promise<void>;
}

export const VisitModal: React.FC<VisitModalProps> = ({
  visit,
  onClose,
  onComplete
}) => {
  const [actualDate, setActualDate] = useState<string>(
    visit.actual_date || new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<string>(visit.status === 'Completed' ? 'Completed' : 'Completed');
  const [notes, setNotes] = useState<string>(visit.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onComplete(visit.id, {
        actual_date: actualDate,
        status,
        notes: notes || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to update visit record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-800 text-white">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-300" />
            <h3 className="font-semibold text-lg">Record Clinical Visit</h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white rounded-lg p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Visit Name:</span>
              <span className="font-semibold text-gray-900">{visit.visit_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sequence #:</span>
              <span className="font-medium text-gray-800">Visit {visit.visit_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Planned Date:</span>
              <span className="text-gray-800">{visit.planned_date}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visit Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="Completed">Completed</option>
              <option value="Missed">Missed</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Scheduled">Scheduled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual Visit Date
            </label>
            <input
              type="date"
              value={actualDate}
              onChange={(e) => setActualDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clinical Assessment & Visit Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Record vitals, intervention compliance, VAS pain score, or reason for missing visit..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Visit Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
