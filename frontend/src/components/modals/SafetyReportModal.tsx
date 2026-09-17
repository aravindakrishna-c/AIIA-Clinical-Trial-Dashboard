import React, { useState } from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import type { AdverseEventCreatePayload, AESeverity, AECausality, AEActionTaken, AEOutcome } from '../../types';

interface SafetyReportModalProps {
  trialId: number;
  siteId: number;
  participantId: number;
  onClose: () => void;
  onReport: (payload: AdverseEventCreatePayload) => Promise<void>;
}

export const SafetyReportModal: React.FC<SafetyReportModalProps> = ({
  trialId,
  siteId,
  participantId,
  onClose,
  onReport
}) => {
  const [eventTerm, setEventTerm] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [severity, setSeverity] = useState<AESeverity>('Mild');
  const [isSerious, setIsSerious] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([]);
  const [isAdr, setIsAdr] = useState(false);
  const [suspectedIntervention, setSuspectedIntervention] = useState('Ayurvedic Formulation / Polyherbal Compound');
  const [causality, setCausality] = useState<AECausality>('Possible');
  const [actionTaken, setActionTaken] = useState<AEActionTaken>('No change');
  const [outcome, setOutcome] = useState<AEOutcome>('Recovering');
  const [investigatorAssessment, setInvestigatorAssessment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seriousnessOptions = [
    'Death',
    'Life-threatening',
    'Hospitalization',
    'Significant disability/incapacity',
    'Congenital anomaly/birth defect',
    'Other medically important condition'
  ];

  const handleCriterionToggle = (crit: string) => {
    if (selectedCriteria.includes(crit)) {
      setSelectedCriteria(selectedCriteria.filter(c => c !== crit));
    } else {
      setSelectedCriteria([...selectedCriteria, crit]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onReport({
        trial_id: trialId,
        site_id: siteId,
        participant_id: participantId,
        event_term: eventTerm,
        event_description: eventDescription,
        start_date: startDate,
        severity,
        is_serious: isSerious,
        seriousness_criteria: isSerious ? selectedCriteria : [],
        is_adr: isAdr,
        suspected_intervention: isAdr ? suspectedIntervention : undefined,
        causality,
        action_taken: actionTaken,
        outcome,
        investigator_assessment: investigatorAssessment || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to report safety event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-100 overflow-hidden animate-fadeIn my-8">
        <div className="flex items-center justify-between px-6 py-4 bg-amber-700 text-white">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-200" />
            <h3 className="font-semibold text-lg">Report Adverse Event (AE / SAE / ADR)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-amber-100 hover:text-white rounded-lg p-1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reported Term (Clinical Symptom / Event) *
              </label>
              <input
                type="text"
                value={eventTerm}
                onChange={(e) => setEventTerm(e.target.value)}
                required
                placeholder="e.g. Epigastric burning, Urticaria, Headache"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Event Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Event Narrative Description *
            </label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows={2}
              required
              placeholder="Describe clinical presentation, timing relative to dosage, and progression..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          {/* Severity vs Seriousness Delineation Banner */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
            <span className="font-semibold">ICH E2A Guidance Notice:</span> <span className="font-medium">Severity</span> refers to symptom intensity (Mild/Mod/Severe). <span className="font-medium">Seriousness</span> is based on regulatory outcome criteria (Hospitalization, Life-threatening, etc.). A severe headache is not necessarily an SAE.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Severity (Intensity)
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AESeverity)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="Mild">Mild — Easily tolerated, no disruption of daily activities</option>
                <option value="Moderate">Moderate — Discomfort sufficient to reduce normal activities</option>
                <option value="Severe">Severe — Incapacitating, inability to work or perform ADLs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Serious Adverse Event (SAE) Classification
              </label>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="saeCheck"
                  checked={isSerious}
                  onChange={(e) => setIsSerious(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <label htmlFor="saeCheck" className="text-sm font-bold text-red-700 cursor-pointer">
                  Classify as Serious (SAE)
                </label>
              </div>
            </div>
          </div>

          {isSerious && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
              <span className="block text-xs font-bold text-red-900">
                Select Applicable Regulatory Seriousness Criteria:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {seriousnessOptions.map(crit => (
                  <label key={crit} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCriteria.includes(crit)}
                      onChange={() => handleCriterionToggle(crit)}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span className="text-gray-800">{crit}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                WHO-UMC Causality
              </label>
              <select
                value={causality}
                onChange={(e) => setCausality(e.target.value as AECausality)}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="Not Related">Not Related</option>
                <option value="Unlikely">Unlikely</option>
                <option value="Possible">Possible</option>
                <option value="Probable">Probable</option>
                <option value="Very Likely">Very Likely</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Action Taken
              </label>
              <select
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value as AEActionTaken)}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="No change">No change</option>
                <option value="Dose reduced">Dose reduced</option>
                <option value="Dose interrupted">Dose interrupted</option>
                <option value="Intervention stopped">Intervention stopped</option>
                <option value="Hospitalization">Hospitalization</option>
                <option value="Additional treatment">Additional treatment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as AEOutcome)}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="Recovered">Recovered</option>
                <option value="Recovering">Recovering</option>
                <option value="Not recovered">Not recovered</option>
                <option value="Recovered with sequelae">Recovered with sequelae</option>
                <option value="Fatal">Fatal</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                id="adrCheck"
                checked={isAdr}
                onChange={(e) => setIsAdr(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="adrCheck" className="text-xs font-semibold text-gray-800 cursor-pointer">
                Classify as Adverse Drug/Intervention Reaction (ADR)
              </label>
            </div>
            {isAdr && (
              <input
                type="text"
                value={suspectedIntervention}
                onChange={(e) => setSuspectedIntervention(e.target.value)}
                placeholder="Suspected formulation name / batch"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-amber-500 focus:border-amber-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Investigator Clinical Rationale & Assessment
            </label>
            <textarea
              value={investigatorAssessment}
              onChange={(e) => setInvestigatorAssessment(e.target.value)}
              rows={2}
              placeholder="Clinical evaluation of dechallenge/rechallenge and concurrent therapies..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-amber-500 focus:border-amber-500"
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
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Transmitting...' : 'Submit Safety Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
