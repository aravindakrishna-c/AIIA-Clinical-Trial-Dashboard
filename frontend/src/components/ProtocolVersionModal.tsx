import React, { useState } from 'react';
import { Modal } from './Modal';
import { trialService } from '../services/trialService';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProtocolVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialId: string;
  currentVersion: string;
  onSuccess: () => void;
}

export const ProtocolVersionModal: React.FC<ProtocolVersionModalProps> = ({
  isOpen,
  onClose,
  trialId,
  currentVersion,
  onSuccess
}) => {
  const [versionNumber, setVersionNumber] = useState('');
  const [versionDate, setVersionDate] = useState(new Date().toISOString().split('T')[0]);
  const [changeSummary, setChangeSummary] = useState('');
  const [documentRef, setDocumentRef] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionNumber || !versionDate || !changeSummary) {
      setError('Please fill in version number, date, and change summary.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await trialService.createProtocolVersion(trialId, {
        version_number: versionNumber,
        version_date: versionDate,
        change_summary: changeSummary,
        document_reference: documentRef || undefined
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create protocol version.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Protocol Amendment / Version">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-slate-700">
          <span>Current Active Protocol Version:</span>
          <span className="font-mono font-bold text-ayush-800 bg-white px-2 py-0.5 border border-slate-200 rounded">
            v{currentVersion}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Version Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
              placeholder="e.g. 1.1 or 2.0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Version / Amendment Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={versionDate}
              onChange={(e) => setVersionDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Amendment / Change Summary <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            rows={3}
            placeholder="Detailed description of protocol alterations, inclusion/exclusion criteria modifications, or safety updates..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none placeholder-slate-400"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Document / IEC Filing Reference
          </label>
          <input
            type="text"
            value={documentRef}
            onChange={(e) => setDocumentRef(e.target.value)}
            placeholder="e.g. IEC-AMEND-2026-042-REV1"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
          />
        </div>

        <p className="text-[11px] text-slate-500 italic">
          Registering this version will preserve historical protocol revisions and mark previous versions as 'Superseded'.
        </p>

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
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 font-semibold text-white bg-ayush-700 hover:bg-ayush-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isLoading ? 'Registering...' : 'Register Protocol Version'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
