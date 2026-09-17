import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import type { TrialStatus } from '../types';
import { trialService } from '../services/trialService';
import { ArrowRight, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface StatusTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialId: string;
  currentStatus: TrialStatus;
  onSuccess: () => void;
}

const VALID_TRANSITIONS: Record<TrialStatus, TrialStatus[]> = {
  Draft: ['Ethics Review'],
  'Ethics Review': ['Ethics Approved', 'Draft'],
  'Ethics Approved': ['CTRI Pending'],
  'CTRI Pending': ['Recruiting'],
  Recruiting: ['Active', 'Suspended'],
  Active: ['Suspended', 'Completed', 'Terminated'],
  Suspended: ['Active', 'Terminated'],
  Completed: ['Closed'],
  Terminated: ['Closed'],
  Closed: []
};

export const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
  isOpen,
  onClose,
  trialId,
  currentStatus,
  onSuccess
}) => {
  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
  const [selectedStatus, setSelectedStatus] = useState<TrialStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(allowedNext.length > 0 ? allowedNext[0] : '');
      setNotes('');
      setError(null);
    }
  }, [isOpen, currentStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      setError('Please choose a valid destination status.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await trialService.updateTrialStatus(trialId, selectedStatus, notes);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update trial status.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Clinical Trial Lifecycle Status">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Workflow Transition Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Current to Target Preview */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Status Transition Path
          </p>
          <div className="flex items-center space-x-3">
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Current State</span>
              <StatusBadge status={currentStatus} type="trialStatus" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 mt-4" />
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Target State</span>
              {selectedStatus ? (
                <StatusBadge status={selectedStatus} type="trialStatus" />
              ) : (
                <span className="text-xs text-slate-400 italic">Select below</span>
              )}
            </div>
          </div>
        </div>

        {allowedNext.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 text-amber-800 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              This trial has reached terminal state <strong>'{currentStatus}'</strong>. No further status changes
              are permitted in accordance with GCP regulatory principles.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Permitted Next Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as TrialStatus)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ayush-600 focus:border-transparent"
              required
            >
              {allowedNext.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Backend validates strictly against institutional CDSCO/GCP lifecycle state machines.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Audit Rationale & Justification
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Document reason for status change (e.g., IEC approval reference, recruitment milestone achieved, safety suspension note)..."
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ayush-600 focus:border-transparent placeholder-slate-400"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Recorded in immutable 21 CFR Part 11 audit log along with your user signature.
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || allowedNext.length === 0}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-ayush-700 hover:bg-ayush-800 disabled:opacity-50 rounded-lg shadow transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isLoading ? 'Updating Status...' : 'Confirm Status Change'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
