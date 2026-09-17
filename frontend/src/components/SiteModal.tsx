import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { TrialSite, SiteStatus, User } from '../types';
import { trialService } from '../services/trialService';
import { userService } from '../services/userService';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialId: string;
  site?: TrialSite | null;
  onSuccess: () => void;
}

export const SiteModal: React.FC<SiteModalProps> = ({
  isOpen,
  onClose,
  trialId,
  site,
  onSuccess
}) => {
  const isEditing = Boolean(site);
  const [users, setUsers] = useState<User[]>([]);

  // Form fields
  const [siteCode, setSiteCode] = useState('');
  const [siteName, setSiteName] = useState('');
  const [institution, setInstitution] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [siteInvestigatorId, setSiteInvestigatorId] = useState<number | ''>('');
  const [activationDate, setActivationDate] = useState('');
  const [siteStatus, setSiteStatus] = useState<SiteStatus>('Pending');
  const [enrollmentTarget, setEnrollmentTarget] = useState(25);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load potential site investigators
      userService.getUsers().then(setUsers).catch(console.error);

      if (site) {
        setSiteCode(site.site_code);
        setSiteName(site.site_name);
        setInstitution(site.institution);
        setLocation(site.location);
        setCity(site.city);
        setState(site.state);
        setCountry(site.country);
        setSiteInvestigatorId(site.site_investigator_id || '');
        setActivationDate(site.activation_date || '');
        setSiteStatus(site.site_status);
        setEnrollmentTarget(site.enrollment_target);
      } else {
        setSiteCode('');
        setSiteName('');
        setInstitution('');
        setLocation('');
        setCity('');
        setState('');
        setCountry('India');
        setSiteInvestigatorId('');
        setActivationDate('');
        setSiteStatus('Pending');
        setEnrollmentTarget(30);
      }
      setError(null);
    }
  }, [isOpen, site]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteCode || !siteName || !institution || !location || !city || !state) {
      setError('Please fill out all required location and demographic fields.');
      return;
    }

    if (enrollmentTarget <= 0) {
      setError('Enrollment target must be greater than 0.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isEditing && site) {
        await trialService.updateSite(site.id, {
          site_name: siteName,
          institution,
          location,
          city,
          state,
          country,
          site_investigator_id: siteInvestigatorId ? Number(siteInvestigatorId) : undefined,
          activation_date: activationDate || undefined,
          enrollment_target: enrollmentTarget
        });
      } else {
        await trialService.createSite(trialId, {
          site_code: siteCode,
          site_name: siteName,
          institution,
          location,
          city,
          state,
          country,
          site_investigator_id: siteInvestigatorId ? Number(siteInvestigatorId) : undefined,
          activation_date: activationDate || undefined,
          site_status: siteStatus,
          enrollment_target: enrollmentTarget
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save site.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Site: ${site?.site_code}` : 'Add Investigational Trial Site'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Site Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={siteCode}
              onChange={(e) => setSiteCode(e.target.value.toUpperCase())}
              disabled={isEditing}
              placeholder="e.g. AIIA-001 or SITE-201"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none uppercase font-mono disabled:bg-slate-100"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Enrollment Target <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={enrollmentTarget}
              onChange={(e) => setEnrollmentTarget(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Site Facility / Department Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="e.g. Advanced Ayurveda Clinical Research Center"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Host Institution / Hospital <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g. All India Institute of Ayurveda"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Address / Location <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Mathura Road, Gautam Puri, Sarita Vihar"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              City <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              State <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Country <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Site Principal Investigator
            </label>
            <select
              value={siteInvestigatorId}
              onChange={(e) => setSiteInvestigatorId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white"
            >
              <option value="">Select Investigator</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.role?.name || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          {!isEditing && (
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Initial Site Status
              </label>
              <select
                value={siteStatus}
                onChange={(e) => setSiteStatus(e.target.value as SiteStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="Ethics Pending">Ethics Pending</option>
                <option value="Activated">Activated</option>
              </select>
            </div>
          )}

          {isEditing && (
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Activation Date
              </label>
              <input
                type="date"
                value={activationDate}
                onChange={(e) => setActivationDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              />
            </div>
          )}
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
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 font-semibold text-white bg-ayush-700 hover:bg-ayush-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Register Site'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
