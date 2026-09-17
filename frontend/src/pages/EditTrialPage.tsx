import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trialService } from '../services/trialService';
import { userService } from '../services/userService';
import type { UpdateTrialPayload, User } from '../types';
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Save
} from 'lucide-react';

export const EditTrialPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState<UpdateTrialPayload>({
    trial_title: '',
    short_title: '',
    protocol_number: '',
    study_type: '',
    study_phase: '',
    study_design: '',
    sponsor: '',
    sponsor_type: '',
    sponsor_contact: '',
    principal_investigator_id: 0,
    disease_condition: '',
    ayurveda_intervention: '',
    intervention_type: '',
    intervention_description: '',
    dosage: '',
    route_of_administration: '',
    frequency: '',
    duration: '',
    formulation_procedure: '',
    comparator: '',
    comparator_description: '',
    target_participants: 0,
    start_date: '',
    expected_completion_date: '',
    inclusion_criteria: '',
    exclusion_criteria: '',
    primary_objective: '',
    secondary_objectives: ''
  });

  useEffect(() => {
    if (!id) return;
    Promise.all([
      trialService.getTrial(id),
      userService.getUsers()
    ])
      .then(([trial, fetchedUsers]) => {
        setUsers(fetchedUsers);
        setFormData({
          trial_title: trial.trial_title,
          short_title: trial.short_title || '',
          protocol_number: trial.protocol_number,
          study_type: trial.study_type,
          study_phase: trial.study_phase,
          study_design: trial.study_design,
          sponsor: trial.sponsor,
          sponsor_type: trial.sponsor_type,
          sponsor_contact: trial.sponsor_contact || '',
          principal_investigator_id: trial.principal_investigator_id,
          disease_condition: trial.disease_condition,
          ayurveda_intervention: trial.ayurveda_intervention,
          intervention_type: trial.intervention_type,
          intervention_description: trial.intervention_description,
          dosage: trial.dosage || '',
          route_of_administration: trial.route_of_administration || '',
          frequency: trial.frequency || '',
          duration: trial.duration || '',
          formulation_procedure: trial.formulation_procedure || '',
          comparator: trial.comparator || '',
          comparator_description: trial.comparator_description || '',
          target_participants: trial.target_participants,
          start_date: trial.start_date,
          expected_completion_date: trial.expected_completion_date,
          inclusion_criteria: trial.inclusion_criteria,
          exclusion_criteria: trial.exclusion_criteria,
          primary_objective: trial.primary_objective,
          secondary_objectives: trial.secondary_objectives || ''
        });
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load trial data.');
        setIsLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!formData.trial_title?.trim()) {
      setError('Trial title cannot be empty.');
      return;
    }

    if (formData.target_participants && formData.target_participants <= 0) {
      setError('Target participants must be greater than zero.');
      return;
    }

    if (formData.start_date && formData.expected_completion_date) {
      if (new Date(formData.expected_completion_date) < new Date(formData.start_date)) {
        setError('Expected completion date cannot be earlier than start date.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await trialService.updateTrial(id, formData);
      navigate(`/trials/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update trial.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-500 text-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-ayush-600 mb-3" />
        <p className="font-semibold text-slate-700">Loading Trial Edit Form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <button
          onClick={() => navigate(`/trials/${id}`)}
          className="hover:text-ayush-700 flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Trial Dossier</span>
        </button>
        <span>/</span>
        <span className="text-slate-800 font-medium font-mono">{id}</span>
        <span>/</span>
        <span className="text-slate-800 font-medium">Edit Attributes</span>
      </div>

      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Edit Clinical Trial Protocol</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify permitted operational, intervention, and schedule parameters (Audit-Logged)
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs">
        {/* Section 1 */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            Protocol Titles & Identification
          </h3>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Trial Title <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="trial_title"
              value={formData.trial_title}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Short Title
              </label>
              <input
                type="text"
                name="short_title"
                value={formData.short_title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Disease / Clinical Condition
              </label>
              <input
                type="text"
                name="disease_condition"
                value={formData.disease_condition}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            Study Categorization
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Study Type
              </label>
              <select
                name="study_type"
                value={formData.study_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white"
              >
                <option value="Interventional">Interventional</option>
                <option value="Observational">Observational</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Study Phase
              </label>
              <select
                name="study_phase"
                value={formData.study_phase}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white"
              >
                <option value="Early Phase">Early Phase</option>
                <option value="Phase I">Phase I</option>
                <option value="Phase II">Phase II</option>
                <option value="Phase III">Phase III</option>
                <option value="Phase IV">Phase IV</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Participants
              </label>
              <input
                type="number"
                min="1"
                name="target_participants"
                value={formData.target_participants}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Principal Investigator
            </label>
            <select
              name="principal_investigator_id"
              value={formData.principal_investigator_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white font-medium"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role?.name || 'Staff'}) — {u.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 3: Ayurveda Intervention */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            Ayurveda Intervention Specifics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Intervention Name
              </label>
              <input
                type="text"
                name="ayurveda_intervention"
                value={formData.ayurveda_intervention}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Intervention Type
              </label>
              <select
                name="intervention_type"
                value={formData.intervention_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white"
              >
                <option value="Herbal">Herbal</option>
                <option value="Herbo-mineral">Herbo-mineral</option>
                <option value="Panchakarma">Panchakarma</option>
                <option value="Rasayana">Rasayana</option>
                <option value="Medicated Ghee (Ghrita)">Medicated Ghee (Ghrita)</option>
                <option value="Medicated Oil (Taila)">Medicated Oil (Taila)</option>
                <option value="Diet/Lifestyle">Diet/Lifestyle</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description & Formulation Details
            </label>
            <textarea
              name="intervention_description"
              value={formData.intervention_description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Dosage</label>
              <input
                type="text"
                name="dosage"
                value={formData.dosage}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Route</label>
              <input
                type="text"
                name="route_of_administration"
                value={formData.route_of_administration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Frequency</label>
              <input
                type="text"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Duration</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Timeline */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            Timeline Dates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Expected Completion Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="expected_completion_date"
                value={formData.expected_completion_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 5: Criteria */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            Objectives & Eligibility Criteria
          </h3>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Primary Objective <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="primary_objective"
              value={formData.primary_objective}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Inclusion Criteria <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="inclusion_criteria"
                value={formData.inclusion_criteria}
                onChange={handleChange}
                rows={5}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Exclusion Criteria <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="exclusion_criteria"
                value={formData.exclusion_criteria}
                onChange={handleChange}
                rows={5}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none font-mono"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate(`/trials/${id}`)}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-2 px-6 py-2 font-bold text-white bg-ayush-700 hover:bg-ayush-800 disabled:opacity-50 rounded-lg shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save & Update Dossier'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
