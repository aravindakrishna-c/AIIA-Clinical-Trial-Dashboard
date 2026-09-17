import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';
import type { EthicsSubmission, EthicsDecisionPayload } from '../../types';

interface EthicsDecisionModalProps {
  submission: EthicsSubmission;
  onClose: () => void;
  onSubmitDecision: (submissionId: number, data: EthicsDecisionPayload) => Promise<void>;
}

export const EthicsDecisionModal: React.FC<EthicsDecisionModalProps> = ({
  submission,
  onClose,
  onSubmitDecision
}) => {
  const [decision, setDecision] = useState<string>('Approved');
  const [approvalNumber, setApprovalNumber] = useState<string>(
    submission.approval_number || `AIIA/IEC/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`
  );
  const [approvalDate, setApprovalDate] = useState<string>(
    submission.approval_date || new Date().toISOString().split('T')[0]
  );
  const [expiryDate, setExpiryDate] = useState<string>(
    submission.expiry_date ||
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [comments, setComments] = useState<string>(submission.comments || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmitDecision(submission.id, {
        decision,
        review_date: new Date().toISOString().split('T')[0],
        approval_number: decision === 'Approved' ? approvalNumber : undefined,
        approval_date: decision === 'Approved' ? approvalDate : undefined,
        expiry_date: decision === 'Approved' ? expiryDate : undefined,
        comments: comments || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to record ethics decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-gray-100 overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <h3 className="font-semibold text-lg">Record IEC Ethics Review Decision</h3>
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

          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200 text-sm space-y-1 text-emerald-900">
            <div className="flex justify-between">
              <span className="text-emerald-700 font-medium">Submission ID:</span>
              <span className="font-bold">{submission.submission_id || `SUB-${submission.id}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700 font-medium">Protocol Version:</span>
              <span>v{submission.protocol_version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700 font-medium">Submission Date:</span>
              <span>{submission.submission_date}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Committee Decision
            </label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 font-medium"
            >
              <option value="Approved">Approved — Full Ethics Clearance Granted</option>
              <option value="Changes Required">Changes Required — Re-submission Required</option>
              <option value="Rejected">Rejected — Protocol Disapproved</option>
              <option value="Renewal Required">Renewal Required — Annual Extension Mandated</option>
            </select>
          </div>

          {decision === 'Approved' && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  IEC Approval Certificate Number
                </label>
                <input
                  type="text"
                  value={approvalNumber}
                  onChange={(e) => setApprovalNumber(e.target.value)}
                  required
                  placeholder="e.g. AIIA/IEC/2026/042"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Approval Date
                  </label>
                  <input
                    type="date"
                    value={approvalDate}
                    onChange={(e) => setApprovalDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Approval Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reviewer Deliberation Comments & Conditions
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="Record quorum feedback, safety considerations, or mandated protocol modifications..."
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
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Commit IEC Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
