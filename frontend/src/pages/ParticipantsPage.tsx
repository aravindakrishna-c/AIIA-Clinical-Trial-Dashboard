import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  Dna,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { participantService } from '../services/participantService';
import { trialService } from '../services/trialService';
import { useAuth } from '../context/AuthContext';
import { RandomizationModal } from '../components/modals/RandomizationModal';
import type {
  ParticipantListItem,
  ParticipantSummaryStats,
  ClinicalTrialListItem,
  ParticipantDetail
} from '../types';

export const ParticipantsPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [participants, setParticipants] = useState<ParticipantListItem[]>([]);
  const [summary, setSummary] = useState<ParticipantSummaryStats | null>(null);
  const [trials, setTrials] = useState<ClinicalTrialListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedTrialId, setSelectedTrialId] = useState<number | undefined>();
  const [selectedSiteId] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedEligibility, setSelectedEligibility] = useState<string>('');

  // Modals
  const [randomizingParticipant, setRandomizingParticipant] = useState<ParticipantDetail | null>(null);

  const canCreateParticipant = hasPermission('participant.create') || hasPermission('participant.screen');
  const canEnroll = hasPermission('participant.enroll');
  const canRandomize = hasPermission('participant.randomize');

  useEffect(() => {
    loadTrials();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedTrialId, selectedSiteId, selectedStatus, selectedEligibility]);

  const loadTrials = async () => {
    try {
      const trialList = await trialService.getTrials({ limit: 100 });
      setTrials(trialList);
    } catch (err) {
      console.error('Failed to load trials for filter', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listData, statsData] = await Promise.all([
        participantService.listParticipants({
          trial_id: selectedTrialId,
          site_id: selectedSiteId,
          status: selectedStatus || undefined,
          eligibility_status: selectedEligibility || undefined,
          search: search || undefined
        }),
        participantService.getSummary(selectedTrialId)
      ]);
      setParticipants(listData);
      setSummary(statsData);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to fetch participants data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenRandomization = async (id: number) => {
    try {
      const detail = await participantService.getParticipant(id);
      setRandomizingParticipant(detail);
    } catch (err) {
      alert('Failed to load participant details for randomization.');
    }
  };

  const handleExecuteRandomize = async (treatmentGroup?: string) => {
    if (!randomizingParticipant) return;
    await participantService.randomizeParticipant(randomizingParticipant.id, {
      treatment_group: treatmentGroup
    });
    fetchData();
  };

  const handleEnrollClick = async (id: number) => {
    if (!window.confirm('Confirm participant enrollment into trial protocol visit tracking?')) return;
    try {
      await participantService.enrollParticipant(id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.detail || 'Failed to enroll participant.');
    }
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'Active':
      case 'Randomized':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">{statusStr}</span>;
      case 'Enrolled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{statusStr}</span>;
      case 'Screened':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">{statusStr}</span>;
      case 'Ineligible':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">{statusStr}</span>;
      case 'Withdrawn':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">{statusStr}</span>;
      case 'Completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">{statusStr}</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{statusStr}</span>;
    }
  };

  const getEligibilityBadge = (elig: string) => {
    switch (elig) {
      case 'Eligible':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"><CheckCircle className="w-3 h-3" /> Eligible</span>;
      case 'Ineligible':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200"><XCircle className="w-3 h-3" /> Ineligible</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"><AlertTriangle className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white bg-opacity-10 rounded-lg">
              <Users className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Participant Lifecycle Management</h1>
              <p className="text-emerald-200 text-xs md:text-sm mt-0.5">
                De-identified GCP compliant volunteer screening, eligibility evaluation, server randomization & visit tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/interoperability"
            className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-800 bg-opacity-60 hover:bg-opacity-100 text-emerald-100 rounded-lg text-sm font-medium border border-emerald-600 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>CDISC Export</span>
          </Link>

          {canCreateParticipant && (
            <Link
              to="/participants/screening"
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-semibold shadow-md transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Screen New Participant</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Metrics Ribbon */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm text-center">
            <span className="text-xs text-gray-500 font-medium block uppercase tracking-wider">Screened</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">{summary.total_screened}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm text-center">
            <span className="text-xs text-emerald-700 font-medium block uppercase tracking-wider">Eligible</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{summary.eligible}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm text-center">
            <span className="text-xs text-blue-700 font-medium block uppercase tracking-wider">Enrolled</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">{summary.enrolled}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm text-center">
            <span className="text-xs text-purple-700 font-medium block uppercase tracking-wider">Randomized</span>
            <span className="text-2xl font-bold text-purple-600 mt-1 block">{summary.randomized}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm text-center">
            <span className="text-xs text-emerald-800 font-medium block uppercase tracking-wider">Active</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">{summary.active}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm text-center">
            <span className="text-xs text-teal-700 font-medium block uppercase tracking-wider">Completed</span>
            <span className="text-2xl font-bold text-teal-600 mt-1 block">{summary.completed}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-sm text-center">
            <span className="text-xs text-amber-700 font-medium block uppercase tracking-wider">Withdrawn</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{summary.withdrawn}</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Participant ID (e.g. AIIA-CT001-P001) or Screening #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </form>

          <div>
            <select
              value={selectedTrialId || ''}
              onChange={(e) => setSelectedTrialId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Clinical Trials</option>
              {trials.map(t => (
                <option key={t.id} value={t.id}>{t.trial_id} - {t.short_title || t.protocol_number}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Lifecycle Stages</option>
              <option value="Screened">Screened</option>
              <option value="Eligible">Eligible</option>
              <option value="Ineligible">Ineligible</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Randomized">Randomized</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Withdrawn">Withdrawn</option>
              <option value="Lost to Follow-up">Lost to Follow-up</option>
            </select>
          </div>

          <div>
            <select
              value={selectedEligibility}
              onChange={(e) => setSelectedEligibility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Eligibility Statuses</option>
              <option value="Eligible">Eligible</option>
              <option value="Ineligible">Ineligible</option>
              <option value="Pending">Pending Evaluation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
            <p>Loading clinical participants database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : participants.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No Participant Records Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
              Adjust search filters or initiate a new de-identified participant screening record.
            </p>
            {canCreateParticipant && (
              <Link
                to="/participants/screening"
                className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-medium hover:bg-emerald-800 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Screen First Participant</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Participant ID</th>
                  <th className="px-4 py-3">Trial / Site</th>
                  <th className="px-4 py-3">Age / Sex</th>
                  <th className="px-4 py-3">Screening Date</th>
                  <th className="px-4 py-3">Eligibility</th>
                  <th className="px-4 py-3">Enrollment</th>
                  <th className="px-4 py-3">Treatment Arm</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.map((p) => {
                  const statusVal = p.status || p.participant_status || 'Screened';
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        <Link
                          to={`/participants/${p.id}`}
                          className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5"
                        >
                          {p.participant_id}
                        </Link>
                        <span className="block text-xs font-normal text-gray-400">
                          {p.screening_number}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-gray-800 block text-xs">{p.trial_id_str || `Trial #${p.trial_id}`}</span>
                        <span className="text-xs text-gray-500">{p.site_code || `Site #${p.site_id}`}</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-900 font-medium">{p.age}y</span>
                        <span className="text-gray-400 text-xs ml-1.5 font-normal">({p.sex})</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                        {p.screening_date}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {getEligibilityBadge(p.eligibility_status)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {p.enrollment_date ? (
                          <span className="text-gray-900 font-medium">{p.enrollment_date}</span>
                        ) : (
                          <span className="text-gray-400 italic">Not enrolled</span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {p.treatment_group ? (
                          <span className="font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {p.treatment_group.split('—')[0].trim()}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(statusVal)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right space-x-1.5">
                        <Link
                          to={`/participants/${p.id}`}
                          className="inline-flex items-center p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                          title="View Participant Profile & Visits"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {canEnroll && p.eligibility_status === 'Eligible' && statusVal === 'Screened' && (
                          <button
                            onClick={() => handleEnrollClick(p.id)}
                            className="inline-flex items-center px-2 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition"
                            title="Enroll Eligible Participant"
                          >
                            Enroll
                          </button>
                        )}

                        {canRandomize && statusVal === 'Enrolled' && (
                          <button
                            onClick={() => handleOpenRandomization(p.id)}
                            className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded shadow-sm transition"
                            title="Execute Server-Side Randomization"
                          >
                            <Dna className="w-3.5 h-3.5" />
                            <span>Randomize</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Randomization Modal */}
      {randomizingParticipant && (
        <RandomizationModal
          participant={randomizingParticipant}
          onClose={() => setRandomizingParticipant(null)}
          onRandomize={handleExecuteRandomize}
        />
      )}
    </div>
  );
};
