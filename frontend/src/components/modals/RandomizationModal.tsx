import React, { useState } from 'react';
import { X, Dna, AlertCircle, CheckCircle } from 'lucide-react';
import type { ParticipantDetail } from '../../types';

interface RandomizationModalProps {
  participant: ParticipantDetail;
  onClose: () => void;
  onRandomize: (treatmentGroup?: string) => Promise<void>;
}

export const RandomizationModal: React.FC<RandomizationModalProps> = ({
  participant,
  onClose,
  onRandomize
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onRandomize(selectedGroup || undefined);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Randomization failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-100 overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-800 text-white">
          <div className="flex items-center space-x-2">
            <Dna className="w-5 h-5 text-emerald-300" />
            <h3 className="font-semibold text-lg">Server-Side Randomization</h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white rounded-lg p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 space-y-1 text-sm text-emerald-900">
            <div className="flex justify-between">
              <span className="text-emerald-700 font-medium">Participant ID:</span>
              <span className="font-bold">{participant.participant_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700 font-medium">Screening Number:</span>
              <span>{participant.screening_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700 font-medium">Demographics:</span>
              <span>{participant.age} yrs • {participant.sex}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700 font-medium">Eligibility Status:</span>
              <span className="text-emerald-800 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Verified Eligible
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Allocation Strategy
            </label>
            <div className="space-y-3">
              <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition border-gray-200">
                <input
                  type="radio"
                  name="groupOption"
                  value=""
                  checked={selectedGroup === ''}
                  onChange={() => setSelectedGroup('')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900 block">
                    Automated Block Randomization (Recommended)
                  </span>
                  <span className="text-xs text-gray-500">
                    System server dynamically allocates to Group A or Group B preserving 1:1 balance.
                  </span>
                </div>
              </label>

              <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition border-gray-200">
                <input
                  type="radio"
                  name="groupOption"
                  value="Group A — Ayurveda Intervention"
                  checked={selectedGroup === 'Group A — Ayurveda Intervention'}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900 block">
                    Group A — Ayurveda Intervention
                  </span>
                  <span className="text-xs text-gray-500">
                    Investigational classical/standardized Ayurvedic formulation.
                  </span>
                </div>
              </label>

              <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition border-gray-200">
                <input
                  type="radio"
                  name="groupOption"
                  value="Group B — Comparator/Control"
                  checked={selectedGroup === 'Group B — Comparator/Control'}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900 block">
                    Group B — Comparator / Standard Care Control
                  </span>
                  <span className="text-xs text-gray-500">
                    Standard of care active comparator arm.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
            <span className="font-semibold">Audit Notice:</span> Randomization generates an immutable RND number and initiates the protocol visit adherence tracker. Once assigned, changes require formal protocol amendment approval.
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
              {isSubmitting ? 'Randomizing...' : 'Execute Randomization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
