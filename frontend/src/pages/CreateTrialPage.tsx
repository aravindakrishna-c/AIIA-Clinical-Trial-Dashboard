import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trialService } from '../services/trialService';
import { userService } from '../services/userService';
import type { User, CreateTrialPayload } from '../types';
import {
  FileText,
  FlaskConical,
  UserCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Layers
} from 'lucide-react';

const getInitialFormData = (currentUserId?: number): CreateTrialPayload => ({
  trial_id: `AIIA-CT-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
  trial_title: '',
  short_title: '',
  protocol_number: `AIIA/IEC/2026/${String(Math.floor(Math.random() * 900) + 100)}`,
  protocol_version: '1.0',
  protocol_version_date: new Date().toISOString().split('T')[0],
  study_type: 'Interventional',
  study_phase: 'Phase II',
  study_design: 'Parallel Group, Randomized, Double-Blind',
  sponsor: 'All India Institute of Ayurveda',
  sponsor_type: 'Government',
  sponsor_contact: 'clinical.trials@aiia.gov.in / +91-11-29948482',
  principal_investigator_id: currentUserId || 0,
  disease_condition: '',
  ayurveda_intervention: '',
  intervention_type: 'Herbal',
  intervention_description: '',
  dosage: '',
  route_of_administration: 'Oral',
  frequency: 'Twice daily after meals',
  duration: '12 weeks',
  formulation_procedure: '',
  comparator: 'Placebo Comparator',
  comparator_description: '',
  target_participants: 60,
  planned_enrollment_start_date: new Date().toISOString().split('T')[0],
  start_date: new Date().toISOString().split('T')[0],
  expected_completion_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  inclusion_criteria: '1. Age 18-65 years\n2. Confirmed clinical diagnosis\n3. Willing and able to provide written informed consent',
  exclusion_criteria: '1. Known allergy or intolerance to study formulations\n2. Severe hepatic, renal, or cardiovascular impairment\n3. Pregnant or lactating women',
  primary_objective: '',
  secondary_objectives: ''
});

export const CreateTrialPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'study' | 'ayurveda' | 'investigator' | 'timeline' | 'criteria'>('basic');

  // Form State
  const [formData, setFormData] = useState<CreateTrialPayload>(() => getInitialFormData(user?.id));

  useEffect(() => {
    userService.getUsers().then((fetchedUsers) => {
      setUsers(fetchedUsers);
      if (!formData.principal_investigator_id && fetchedUsers.length > 0) {
        const defaultPI = fetchedUsers.find((u) => u.role?.name === 'PRINCIPAL_INVESTIGATOR') || fetchedUsers[0];
        setFormData((prev) => ({ ...prev, principal_investigator_id: defaultPI.id }));
      }
    }).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.trial_id.trim()) return 'Trial ID is required.';
    if (!formData.trial_title.trim() || formData.trial_title.length < 5) return 'Trial title must be at least 5 characters.';
    if (!formData.protocol_number.trim()) return 'Protocol number is required.';
    if (!formData.disease_condition.trim()) return 'Disease/Condition is required.';
    if (!formData.ayurveda_intervention.trim()) return 'Ayurveda intervention name is required.';
    if (!formData.primary_objective.trim()) return 'Primary objective is required.';
    if (formData.target_participants <= 0) return 'Target participants must be greater than zero.';
    if (new Date(formData.expected_completion_date) < new Date(formData.start_date)) {
      return 'Expected completion date cannot be earlier than start date.';
    }
    if (!formData.principal_investigator_id) return 'Please assign a Principal Investigator.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await trialService.createTrial(formData);
      navigate(`/trials/${created.trial_id}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create clinical trial.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top breadcrumb & header */}
      <div className="flex items-center space-x-3 text-xs text-slate-500">
        <button
          onClick={() => navigate('/trials')}
          className="hover:text-ayush-700 flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Trials Registry</span>
        </button>
        <span>/</span>
        <span className="text-slate-800 font-medium">New Protocol Registration</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Register Clinical Trial Protocol</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phase 2 GCP Compliant Ayurveda Research Protocol Entry
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Validation Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation / Progress Steps */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'basic'
              ? 'border-ayush-700 text-ayush-900 bg-ayush-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. Basic Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('study')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'study'
              ? 'border-ayush-700 text-ayush-900 bg-ayush-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Study Design</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ayurveda')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'ayurveda'
              ? 'border-ayush-700 text-ayush-900 bg-ayush-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>3. Ayurveda Intervention</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('investigator')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'investigator'
              ? 'border-ayush-700 text-ayush-900 bg-ayush-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>4. Investigator & Sponsor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'timeline'
              ? 'border-ayush-700 text-ayush-900 bg-ayush-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>5. Target & Dates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('criteria')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'criteria'
              ? 'border-ayush-700 text-ayush-900 bg-ayush-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>6. Eligibility Criteria</span>
        </button>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-b-xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* TAB 1: BASIC INFORMATION */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Basic Protocol Identification</h3>
              <span className="text-[11px] text-slate-400">Step 1 of 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Unique Trial ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="trial_id"
                  value={formData.trial_id}
                  onChange={handleChange}
                  placeholder="e.g. AIIA-CT-2026-001"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none font-mono uppercase"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Unique institutional trial registration number.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Protocol Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="protocol_number"
                  value={formData.protocol_number}
                  onChange={handleChange}
                  placeholder="e.g. AIIA/IEC/2026/042"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Clinical Trial Title <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="trial_title"
                value={formData.trial_title}
                onChange={handleChange}
                rows={2}
                placeholder="Complete descriptive scientific title as submitted to Institutional Ethics Committee..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Short / Public Title
                </label>
                <input
                  type="text"
                  name="short_title"
                  value={formData.short_title}
                  onChange={handleChange}
                  placeholder="e.g. Ashwagandha T2D Glycemic Study"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Protocol Version
                </label>
                <input
                  type="text"
                  name="protocol_version"
                  value={formData.protocol_version}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Protocol Version Date
                </label>
                <input
                  type="date"
                  name="protocol_version_date"
                  value={formData.protocol_version_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('study')}
                className="inline-flex items-center space-x-1 px-4 py-2 text-xs font-semibold text-white bg-ayush-700 hover:bg-ayush-800 rounded-lg transition-colors"
              >
                <span>Continue to Study Design</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: STUDY DESIGN & OBJECTIVES */}
        {activeTab === 'study' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Study Design & Clinical Categorization</h3>
              <span className="text-[11px] text-slate-400">Step 2 of 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Study Type <span className="text-rose-500">*</span>
                </label>
                <select
                  name="study_type"
                  value={formData.study_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white"
                >
                  <option value="Interventional">Interventional</option>
                  <option value="Observational">Observational</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Study Phase <span className="text-rose-500">*</span>
                </label>
                <select
                  name="study_phase"
                  value={formData.study_phase}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white"
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Study Design <span className="text-rose-500">*</span>
                </label>
                <select
                  name="study_design"
                  value={formData.study_design}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white"
                >
                  <option value="Parallel Group, Randomized, Double-Blind">Parallel Group, Randomized, Double-Blind</option>
                  <option value="Parallel Group, Randomized, Open Label">Parallel Group, Randomized, Open Label</option>
                  <option value="Single Group, Open Label">Single Group, Open Label</option>
                  <option value="Non-Randomized, Comparative">Non-Randomized, Comparative</option>
                  <option value="Crossover, Double-Blind">Crossover, Double-Blind</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Disease / Clinical Condition (with Ayurvedic Diagnosis) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="disease_condition"
                value={formData.disease_condition}
                onChange={handleChange}
                placeholder="e.g. Type 2 Diabetes Mellitus (Madhumeha) or Rheumatoid Arthritis (Amavata)"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Primary Objective <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="primary_objective"
                value={formData.primary_objective}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. To evaluate the glycemic efficacy of Ayurvedic intervention in reducing HbA1c at 24 weeks..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Secondary Objectives
              </label>
              <textarea
                name="secondary_objectives"
                value={formData.secondary_objectives}
                onChange={handleChange}
                rows={2}
                placeholder="Key secondary endpoints, safety biomarker panels, quality of life changes..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ayurveda')}
                className="inline-flex items-center space-x-1 px-4 py-2 text-xs font-semibold text-white bg-ayush-700 hover:bg-ayush-800 rounded-lg transition-colors"
              >
                <span>Continue to Ayurveda Specifics</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: AYURVEDA INTERVENTION SPECIFICS */}
        {activeTab === 'ayurveda' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Ayurveda Intervention Specifics</h3>
              <span className="text-[11px] text-slate-400">Step 3 of 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Intervention Name / Formulation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="ayurveda_intervention"
                  value={formData.ayurveda_intervention}
                  onChange={handleChange}
                  placeholder="e.g. Standardized Nishamalaki & Mehamudgara Vati"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Intervention Type <span className="text-rose-500">*</span>
                </label>
                <select
                  name="intervention_type"
                  value={formData.intervention_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white"
                >
                  <option value="Herbal">Herbal</option>
                  <option value="Herbo-mineral">Herbo-mineral</option>
                  <option value="Panchakarma">Panchakarma (Procedure)</option>
                  <option value="Rasayana">Rasayana (Rejuvenation)</option>
                  <option value="Medicated Ghee (Ghrita)">Medicated Ghee (Ghrita)</option>
                  <option value="Medicated Oil (Taila)">Medicated Oil (Taila)</option>
                  <option value="Diet/Lifestyle">Dietary & Lifestyle (Pathya-Apathya)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Intervention Formulation Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="intervention_description"
                value={formData.intervention_description}
                onChange={handleChange}
                rows={2}
                placeholder="Botanical/mineral ingredients, classical reference text (e.g. Charaka Samhita, API monograph), standardization..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Dosage</label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  placeholder="e.g. 500 mg"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Route</label>
                <input
                  type="text"
                  name="route_of_administration"
                  value={formData.route_of_administration}
                  onChange={handleChange}
                  placeholder="Oral / External / Nasal"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Frequency</label>
                <input
                  type="text"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  placeholder="Twice daily after meals"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Duration</label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="24 weeks"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Comparator / Control</label>
                <input
                  type="text"
                  name="comparator"
                  value={formData.comparator}
                  onChange={handleChange}
                  placeholder="Placebo / Standard of Care / Active Comparator"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Comparator Description</label>
                <input
                  type="text"
                  name="comparator_description"
                  value={formData.comparator_description}
                  onChange={handleChange}
                  placeholder="e.g. Microcrystalline cellulose matched tablets or standard Metformin"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('study')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('investigator')}
                className="inline-flex items-center space-x-1 px-4 py-2 text-xs font-semibold text-white bg-ayush-700 hover:bg-ayush-800 rounded-lg transition-colors"
              >
                <span>Continue to Investigator & Sponsor</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: INVESTIGATOR & SPONSOR */}
        {activeTab === 'investigator' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Principal Investigator & Institutional Sponsor</h3>
              <span className="text-[11px] text-slate-400">Step 4 of 6</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Principal Investigator (Lead Clinical Researcher) <span className="text-rose-500">*</span>
              </label>
              <select
                name="principal_investigator_id"
                value={formData.principal_investigator_id}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white font-medium"
                required
              >
                <option value="">Select Investigator from Phase 1 Staff</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role?.name || 'Staff'}) — {u.email}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Reuses existing Phase 1 RBAC user records without duplication.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Sponsor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="sponsor"
                  value={formData.sponsor}
                  onChange={handleChange}
                  placeholder="e.g. All India Institute of Ayurveda"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Sponsor Category / Type <span className="text-rose-500">*</span>
                </label>
                <select
                  name="sponsor_type"
                  value={formData.sponsor_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white"
                >
                  <option value="Government">Government (Ministry of Ayush / ICMR / CCRAS)</option>
                  <option value="Institutional">Institutional (AIIA Internal Grant)</option>
                  <option value="Academic">Academic (University / College)</option>
                  <option value="Industry">Industry / Pharmaceutical Collaborative</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sponsor Contact & Regulatory Filing Address
              </label>
              <input
                type="text"
                name="sponsor_contact"
                value={formData.sponsor_contact}
                onChange={handleChange}
                placeholder="e.g. Department of Clinical Research, AIIA, New Delhi / email@aiia.gov.in"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('ayurveda')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className="inline-flex items-center space-x-1 px-4 py-2 text-xs font-semibold text-white bg-ayush-700 hover:bg-ayush-800 rounded-lg transition-colors"
              >
                <span>Continue to Target & Dates</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: PARTICIPANT TARGET & TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Participant Enrollment Target & Study Timeline</h3>
              <span className="text-[11px] text-slate-400">Step 5 of 6</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Participant Count <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                name="target_participants"
                value={formData.target_participants}
                onChange={handleChange}
                className="w-full sm:w-64 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none font-bold text-slate-900"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Statistically powered sample size planned across all investigational sites (must be &gt; 0).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Planned Enrollment Start Date
                </label>
                <input
                  type="date"
                  name="planned_enrollment_start_date"
                  value={formData.planned_enrollment_start_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Trial Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Expected Completion Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="expected_completion_date"
                  value={formData.expected_completion_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('investigator')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('criteria')}
                className="inline-flex items-center space-x-1 px-4 py-2 text-xs font-semibold text-white bg-ayush-700 hover:bg-ayush-800 rounded-lg transition-colors"
              >
                <span>Continue to Eligibility Criteria</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: ELIGIBILITY CRITERIA & SUBMIT */}
        {activeTab === 'criteria' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Protocol Eligibility Criteria</h3>
              <span className="text-[11px] text-slate-400">Step 6 of 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Inclusion Criteria <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="inclusion_criteria"
                  value={formData.inclusion_criteria}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Protocol-defined inclusion rules (age range, diagnosis, lab parameters)..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Exclusion Criteria <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="exclusion_criteria"
                  value={formData.exclusion_criteria}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Contraindications, concurrent treatments, systemic disease exclusions..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-emerald-900 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Ready to Register Protocol</p>
                <p className="mt-0.5 text-emerald-800">
                  Submitting will create trial <strong>'{formData.trial_id}'</strong> in <strong>Draft</strong> status,
                  initialize Protocol Version 1.0, and record an immutable audit entry signed with your account.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-2 px-6 py-2.5 text-xs font-bold text-white bg-ayush-700 hover:bg-ayush-800 disabled:opacity-50 rounded-lg shadow transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Registering Trial...' : 'Submit & Create Clinical Trial'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
