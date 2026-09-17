import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  AlertCircle,
  Save
} from 'lucide-react';
import { trialService } from '../services/trialService';
import { participantService } from '../services/participantService';
import type { ClinicalTrialListItem, TrialSite } from '../types';

export const ParticipantScreeningPage: React.FC = () => {
  const navigate = useNavigate();

  const [trials, setTrials] = useState<ClinicalTrialListItem[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState<number | ''>('');
  const [trialSites, setTrialSites] = useState<TrialSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<number | ''>('');

  // Demographics
  const [age, setAge] = useState<number>(45);
  const [sex, setSex] = useState<string>('Female');
  const [screeningDate, setScreeningDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [screeningNotes, setScreeningNotes] = useState<string>('');

  // Protocol Criteria Checklists
  const [inclusionCriteria, setInclusionCriteria] = useState<Record<string, 'Met' | 'Not Met' | 'Unknown'>>({
    'Age 35-70 years with confirmed diagnosis': 'Met',
    'Symptom duration > 6 months': 'Met',
    'Voluntary signed GCP Informed Consent Form': 'Met',
    'Willingness to adhere to scheduled outpatient clinic follow-ups': 'Met'
  });

  const [exclusionCriteria, setExclusionCriteria] = useState<Record<string, 'Present' | 'Not Present' | 'Unknown'>>({
    'Severe uncontrolled hepatic, cardiovascular, or renal impairment': 'Not Present',
    'Concurrent corticosteroid or immunosuppressive therapy within 30 days': 'Not Present',
    'Pregnancy, lactation, or planned conception during study': 'Not Present',
    'Known hypersensitivity to any study polyherbal ingredients': 'Not Present'
  });

  const [finalDecision, setFinalDecision] = useState<'Eligible' | 'Ineligible' | 'Pending'>('Eligible');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrials();
  }, []);

  useEffect(() => {
    if (selectedTrialId) {
      loadSites(Number(selectedTrialId));
    } else {
      setTrialSites([]);
      setSelectedSiteId('');
    }
  }, [selectedTrialId]);

  // Recalculate suggested eligibility
  useEffect(() => {
    const allInclusionMet = Object.values(inclusionCriteria).every(v => v === 'Met');
    const allExclusionAbsent = Object.values(exclusionCriteria).every(v => v === 'Not Present');

    if (allInclusionMet && allExclusionAbsent) {
      setFinalDecision('Eligible');
    } else if (
      Object.values(inclusionCriteria).some(v => v === 'Not Met') ||
      Object.values(exclusionCriteria).some(v => v === 'Present')
    ) {
      setFinalDecision('Ineligible');
    } else {
      setFinalDecision('Pending');
    }
  }, [inclusionCriteria, exclusionCriteria]);

  const loadTrials = async () => {
    try {
      const res = await trialService.getTrials({ limit: 100 });
      setTrials(res);
      if (res.length > 0) {
        setSelectedTrialId(res[0].id);
      }
    } catch (err) {
      console.error('Failed to load trials', err);
    }
  };

  const loadSites = async (trialId: number) => {
    try {
      const trialData = await trialService.getTrial(trialId.toString());
      setTrialSites(trialData.sites || []);
      if (trialData.sites && trialData.sites.length > 0) {
        setSelectedSiteId(trialData.sites[0].id);
      }
    } catch (err) {
      console.error('Failed to load trial sites', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrialId || !selectedSiteId) {
      setError('Please select both a Clinical Trial and an Investigational Site.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create screening record
      const participant = await participantService.screenParticipant({
        trial_id: Number(selectedTrialId),
        site_id: Number(selectedSiteId),
        age,
        sex,
        screening_date: screeningDate,
        notes: screeningNotes || undefined
      });

      // 2. Evaluate criteria & commit decision
      await participantService.evaluateEligibility(participant.id, {
        eligibility_status: finalDecision,
        inclusion_answers: inclusionCriteria,
        exclusion_answers: exclusionCriteria,
        notes: `Clinical criteria evaluated. Clinician verified decision: ${finalDecision}.`
      });

      navigate(`/participants/${participant.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Screening submission failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/participants"
          className="inline-flex items-center space-x-1.5 text-sm font-medium text-emerald-800 hover:text-emerald-950 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Participant Register</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserPlus className="w-6 h-6 text-emerald-300" />
            <div>
              <h2 className="text-xl font-bold">New Participant Screening & Eligibility Scorecard</h2>
              <p className="text-emerald-200 text-xs mt-0.5">
                ICH-GCP E6(R2) & Ayush GCP aligned protocol screening and eligibility determination
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Study Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 border-b pb-2">
              1. Study & Investigational Site Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Clinical Trial Protocol *
                </label>
                <select
                  value={selectedTrialId}
                  onChange={(e) => setSelectedTrialId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select Clinical Trial...</option>
                  {trials.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.trial_id} — {t.trial_title.substring(0, 60)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Investigational Trial Site *
                </label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select Investigational Site...</option>
                  {trialSites.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.site_code} — {s.site_name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: De-identified Demographics */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 border-b pb-2">
              2. De-Identified Participant Baseline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Age (Years) *
                </label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Biological Sex *
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Screening Date *
                </label>
                <input
                  type="date"
                  value={screeningDate}
                  onChange={(e) => setScreeningDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Protocol Inclusion Criteria */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900">
                3. Protocol Inclusion Criteria Checklist
              </h3>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                All criteria must be "Met" for eligibility
              </span>
            </div>

            <div className="space-y-2">
              {Object.entries(inclusionCriteria).map(([criterion, val]) => (
                <div key={criterion} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 gap-2">
                  <span className="text-sm text-gray-800 font-medium">{criterion}</span>
                  <div className="flex items-center space-x-2">
                    {(['Met', 'Not Met', 'Unknown'] as const).map(option => (
                      <button
                        type="button"
                        key={option}
                        onClick={() => setInclusionCriteria({ ...inclusionCriteria, [criterion]: option })}
                        className={`px-3 py-1 text-xs rounded font-semibold transition ${
                          val === option
                            ? option === 'Met'
                              ? 'bg-emerald-700 text-white'
                              : option === 'Not Met'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-400 text-white'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Protocol Exclusion Criteria */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900">
                4. Protocol Exclusion Criteria Checklist
              </h3>
              <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Must be "Not Present" for eligibility
              </span>
            </div>

            <div className="space-y-2">
              {Object.entries(exclusionCriteria).map(([criterion, val]) => (
                <div key={criterion} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 gap-2">
                  <span className="text-sm text-gray-800 font-medium">{criterion}</span>
                  <div className="flex items-center space-x-2">
                    {(['Present', 'Not Present', 'Unknown'] as const).map(option => (
                      <button
                        type="button"
                        key={option}
                        onClick={() => setExclusionCriteria({ ...exclusionCriteria, [criterion]: option })}
                        className={`px-3 py-1 text-xs rounded font-semibold transition ${
                          val === option
                            ? option === 'Not Present'
                              ? 'bg-emerald-700 text-white'
                              : option === 'Present'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-400 text-white'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Overall Evaluation & Clinician Override */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  5. Clinical Eligibility Determination
                </h4>
                <p className="text-xs text-gray-500">
                  Algorithmic Scorecard Result:{' '}
                  <span className="font-semibold text-emerald-800">
                    {finalDecision === 'Eligible'
                      ? 'Criteria Satisfied'
                      : finalDecision === 'Ineligible'
                      ? 'Exclusion Conflict Detected'
                      : 'Pending Evaluation'}
                  </span>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-gray-700">Final Clinician Decision:</label>
                <select
                  value={finalDecision}
                  onChange={(e) => setFinalDecision(e.target.value as any)}
                  className="px-3 py-1.5 border border-emerald-300 bg-white rounded-lg text-xs font-bold text-emerald-950 focus:ring-emerald-500"
                >
                  <option value="Eligible">Eligible (Approved for Enrollment)</option>
                  <option value="Ineligible">Ineligible (Screen Failure)</option>
                  <option value="Pending">Pending (Awaiting Labs)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Investigator Screening Notes & Observations
              </label>
              <textarea
                value={screeningNotes}
                onChange={(e) => setScreeningNotes(e.target.value)}
                rows={2}
                placeholder="Include diagnostic imaging findings, Prakriti assessment, or baseline laboratory values..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/participants')}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Screening...' : 'Save Screening & Eligibility Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
