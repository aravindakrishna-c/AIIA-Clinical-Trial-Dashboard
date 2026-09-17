import React, { useState } from 'react';
import type { TrialMilestone, MilestoneStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { Modal } from './Modal';
import { trialService } from '../services/trialService';
import {
  CheckCircle,
  Clock,
  Plus,
  Edit2,
  Flag
} from 'lucide-react';

interface MilestoneTimelineProps {
  trialId: string;
  milestones: TrialMilestone[];
  canManage: boolean;
  onRefresh: () => void;
}

const COMMON_MILESTONES = [
  'Protocol Finalization',
  'Ethics Submission',
  'Ethics Approval',
  'CTRI Registration',
  'Site Activation',
  'Recruitment Start',
  'Recruitment Target (50%)',
  'Recruitment Target (100%)',
  'Final Participant Visit',
  'Data Lock',
  'Clinical Study Report',
  'Trial Completion'
];

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
  trialId,
  milestones,
  canManage,
  onRefresh
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<TrialMilestone | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [actualDate, setActualDate] = useState('');
  const [status, setStatus] = useState<MilestoneStatus>('Planned');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAddModal = () => {
    setName(COMMON_MILESTONES[0]);
    setDescription('');
    setPlannedDate('');
    setActualDate('');
    setStatus('Planned');
    setError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (m: TrialMilestone) => {
    setEditingMilestone(m);
    setName(m.milestone_name);
    setDescription(m.description || '');
    setPlannedDate(m.planned_date);
    setActualDate(m.actual_date || '');
    setStatus(m.status);
    setError(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !plannedDate) {
      setError('Please provide milestone name and planned date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await trialService.createMilestone(trialId, {
        milestone_name: name,
        description: description || undefined,
        planned_date: plannedDate,
        actual_date: actualDate || undefined,
        status
      });
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create milestone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await trialService.updateMilestone(editingMilestone.id, {
        milestone_name: name,
        description: description || undefined,
        planned_date: plannedDate,
        actual_date: actualDate || undefined,
        status
      });
      setEditingMilestone(null);
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update milestone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Protocol Lifecycle Milestones</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Key clinical milestones and regulatory progress checkpoints
          </p>
        </div>
        {canManage && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-ayush-700 hover:bg-ayush-800 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Milestone</span>
          </button>
        )}
      </div>

      {/* Visual Progression Bar */}
      {milestones.length > 0 && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Milestone Trajectory</span>
            <span>
              {milestones.filter((m) => m.status === 'Completed').length} of {milestones.length} Completed
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {milestones.map((m, idx) => {
              const isCompleted = m.status === 'Completed';
              const isInProgress = m.status === 'In Progress';
              return (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                    isCompleted
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : isInProgress
                      ? 'bg-blue-50/80 border-blue-200 text-blue-900 ring-2 ring-blue-400/30'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                      {isCompleted ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      ) : isInProgress ? (
                        <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      ) : (
                        <Flag className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </div>
                    <p className="font-semibold text-[11px] line-clamp-2 leading-tight">
                      {m.milestone_name}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">
                    {m.actual_date || m.planned_date}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Table */}
      {milestones.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <Flag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No milestones registered yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Track ethical, operational, and regulatory checkpoints for this trial.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Milestone</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Planned Date</th>
                <th className="py-3 px-4">Actual Date</th>
                <th className="py-3 px-4">Status</th>
                {canManage && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {milestones.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center space-x-2">
                    <Flag className="w-3.5 h-3.5 text-ayush-600 flex-shrink-0" />
                    <span>{m.milestone_name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                    {m.description || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono">
                    {m.planned_date}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono">
                    {m.actual_date || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={m.status} type="milestoneStatus" />
                  </td>
                  {canManage && (
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditModal(m)}
                        className="p-1 text-slate-400 hover:text-ayush-700 hover:bg-slate-100 rounded transition-colors"
                        title="Update milestone"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Milestone Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Clinical Milestone"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Milestone Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              list="common-milestones"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ethics Committee Approval"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              required
            />
            <datalist id="common-milestones">
              {COMMON_MILESTONES.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Additional deliverables or verification criteria..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Planned Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Date</label>
              <input
                type="date"
                value={actualDate}
                onChange={(e) => setActualDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
            >
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-ayush-700 hover:bg-ayush-800 disabled:opacity-50 rounded-lg"
            >
              {isSubmitting ? 'Saving...' : 'Save Milestone'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Milestone Modal */}
      <Modal
        isOpen={Boolean(editingMilestone)}
        onClose={() => setEditingMilestone(null)}
        title="Update Milestone"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Milestone Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Planned Date</label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Date</label>
              <input
                type="date"
                value={actualDate}
                onChange={(e) => setActualDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-ayush-600 focus:outline-none"
            >
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingMilestone(null)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-ayush-700 hover:bg-ayush-800 disabled:opacity-50 rounded-lg"
            >
              {isSubmitting ? 'Updating...' : 'Update Milestone'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
