import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import type { TrialSite, SiteStatus } from '../types';
import { trialService } from '../services/trialService';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SiteStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: TrialSite | null;
  onSuccess: () => void;
}

const VALID_SITE_TRANSITIONS: Record<SiteStatus, SiteStatus[]> = {
  Pending: ['Ethics Pending'],
  'Ethics Pending': ['Activated', 'Pending'],
  Activated: ['Recruiting', 'Suspended'],
  Recruiting: ['Suspended', 'Closed'],
  Suspended: ['Recruiting', 'Closed'],
  Closed: []
};

export const SiteStatusModal: React.FC<SiteStatusModalProps> = ({
  isOpen,
  onClose,
  site,
  onSuccess
}) => {
  const allowedNext = site ? VALID_SITE_TRANSITIONS[site.site_status] || [] : [];
  const [selectedStatus, setSelectedStatus] = useState<SiteStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && site) {
      const nextOptions = VALID_SITE_TRANSITIONS[site.site_status] || [];
      setSelectedStatus(nextOptions.length > 0 ? nextOptions[0] : '');
      setNotes('');
      setError(null);
    }
  }, [isOpen, site]);

  if (!site) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      setError('Please choose a valid destination status.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await trialService.updateSiteStatus(site.id, selectedStatus, notes);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update site status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Change Status: Site ${site.site_code}`}>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
            Site Status Transition Path
          </p>
          <div className="flex items-center space-x-3">
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Current State</span>
              <StatusBadge status={site.site_status} type="siteStatus" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 mt-3" />
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Target State</span>
              {selectedStatus ? (
                <StatusBadge status={selectedStatus} type="siteStatus" />
              ) : (
                <span className="text-slate-400 italic">None</span>
              )}
            </div>
          </div>
        </div>

        {allowedNext.length === 0 ? (
          <p className="text-slate-500 italic">
            This site is in final state '{site.site_status}'. No further transitions permitted.
          </p>
        ) : (
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Permitted Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as SiteStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white"
              required
            >
              {allowedNext.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Audit Justification Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g., Local IEC approval letter received, monitor cleared site..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none placeholder-slate-400"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || allowedNext.length === 0}
            className="inline-flex items-center space-x-1.5 px-4 py-2 font-semibold text-white bg-ayush-700 hover:bg-ayush-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isLoading ? 'Updating...' : 'Confirm Status Transition'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
