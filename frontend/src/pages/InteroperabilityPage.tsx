import React, { useState, useEffect } from 'react';
import { interopService } from '../services/interopService';
import { trialService } from '../services/trialService';
import type { ClinicalTrialListItem } from '../types';
import {
  Network,
  CheckCircle,
  Database,
  Code,
  ArrowDownToLine,
  RefreshCw
} from 'lucide-react';

export const InteroperabilityPage: React.FC = () => {
  const [trials, setTrials] = useState<ClinicalTrialListItem[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState<number>(1);
  const [selectedResourceType, setSelectedResourceType] = useState<string>('Patient');
  const [resourceId, setResourceId] = useState<number>(1);
  const [fhirData, setFhirData] = useState<any>(null);
  const [isFetchingFhir, setIsFetchingFhir] = useState(false);
  const [fhirError, setFhirError] = useState<string | null>(null);

  // CDISC download loading states
  const [downloadingDomain, setDownloadingDomain] = useState<string | null>(null);

  useEffect(() => {
    trialService.getTrials({ limit: 50 }).then((list: ClinicalTrialListItem[]) => {
      setTrials(list);
      if (list.length > 0) setSelectedTrialId(list[0].id);
    }).catch(console.error);

    fetchFhir(selectedResourceType, resourceId);
  }, []);

  const fetchFhir = async (resType: string, id: number) => {
    try {
      setIsFetchingFhir(true);
      setFhirError(null);
      const data = await interopService.getFhirResource(resType, id);
      setFhirData(data);
    } catch (err: any) {
      console.error('Failed to fetch FHIR resource', err);
      setFhirError(err?.response?.data?.detail || 'Failed to fetch FHIR resource');
      setFhirData(null);
    } finally {
      setIsFetchingFhir(false);
    }
  };

  const handleDownloadCdisc = async (domain: string) => {
    try {
      setDownloadingDomain(domain);
      await interopService.downloadCdiscDomain(domain, selectedTrialId);
    } catch (err) {
      alert(`Failed to download CDISC domain ${domain}`);
    } finally {
      setDownloadingDomain(null);
    }
  };

  const fhirResources = [
    { type: 'Patient', desc: 'De-identified demographic & research identity' },
    { type: 'Encounter', desc: 'Clinical study protocol visits & monitoring' },
    { type: 'Condition', desc: 'Study indication & diagnosed disease condition' },
    { type: 'Medication', desc: 'Ayurvedic formulations & botanical intervention' },
    { type: 'Observation', desc: 'Screening evaluation & clinical baseline values' },
    { type: 'Consent', desc: 'Informed consent documentation & approval dates' }
  ];

  const cdiscDomains = [
    { code: 'DM', name: 'Demographics', desc: 'Core subject demographics (AGE, SEX, COUNTRY, ARMCD)' },
    { code: 'SV', name: 'Subject Visits', desc: 'Planned and actual study protocol visits (VISITNUM, SVSTDTC)' },
    { code: 'AE', name: 'Adverse Events', desc: 'Safety surveillance & pharmacovigilance (AETERM, AESEV, AESER, AEREL)' },
    { code: 'TS', name: 'Trial Summary', desc: 'Study metadata, sponsor details, protocol info (TSPARMCD, TSVAL)' },
    { code: 'TV', name: 'Trial Visits', desc: 'Protocol schedule of visit days and timeframes (VISITNUM, VISIT)' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <span>Interoperability Standards</span>
            <span>/</span>
            <span className="font-semibold text-slate-800">FHIR R4 & CDISC SDTM</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Network className="w-6 h-6 text-emerald-700" />
            Healthcare Data Interoperability
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export study data in CDISC SDTM v1.7 format and access synthetic clinical records via HL7 FHIR Release 4 REST endpoints.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            FHIR R4 & CDISC SDTM Ready
          </span>
        </div>
      </div>

      {/* Grid: 2 Modules (CDISC Export on Left, FHIR Viewer on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): CDISC SDTM Export Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-ayush-700" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  CDISC SDTM Dataset Generator
                </h2>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                CSV Export
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Export standard Clinical Data Interchange Standards Consortium (CDISC) Study Data Tabulation Model (SDTM) datasets for regulatory submissions.
            </p>

            {/* Trial Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Clinical Trial</label>
              <select
                value={selectedTrialId}
                onChange={(e) => setSelectedTrialId(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
              >
                {trials.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.trial_id} - {t.trial_title.substring(0, 35)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Domain Download Cards */}
            <div className="space-y-2.5 pt-2">
              {cdiscDomains.map((domain) => (
                <div
                  key={domain.code}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 transition-colors flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-slate-800 text-white px-1.5 py-0.5 rounded">
                        {domain.code}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{domain.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-xs">{domain.desc}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadCdisc(domain.code)}
                    disabled={downloadingDomain === domain.code}
                    className="inline-flex items-center px-3 py-1.5 bg-ayush-800 hover:bg-ayush-900 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 mr-1" />
                    {downloadingDomain === domain.code ? 'Generating...' : 'Export'}
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-[11px] text-emerald-800">
              <span className="font-semibold">Note on Data Privacy:</span> All exported SDTM records are synthetic and de-identified per GCP and HIPAA safe-harbor standards.
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Interactive FHIR R4 JSON Viewer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  HL7 FHIR Release 4 Resource Inspector
                </h2>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">
                JSON-LD / REST
              </span>
            </div>

            {/* Resource Type Tabs / Selector */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {fhirResources.map((res) => (
                <button
                  key={res.type}
                  onClick={() => {
                    setSelectedResourceType(res.type);
                    fetchFhir(res.type, resourceId);
                  }}
                  className={`p-2 rounded-lg text-center transition-colors border text-xs font-semibold ${
                    selectedResourceType === res.type
                      ? 'bg-ayush-900 text-white border-ayush-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {res.type}
                </button>
              ))}
            </div>

            {/* Request Bar */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-mono bg-slate-100 px-2 py-1.5 rounded text-slate-700 font-bold">
                GET
              </span>
              <span className="font-mono text-slate-500 flex-1 truncate">
                /api/v1/fhir/{selectedResourceType}/{resourceId}
              </span>
              <div className="flex items-center space-x-1">
                <label className="text-slate-500 font-medium">ID:</label>
                <input
                  type="number"
                  min={1}
                  value={resourceId}
                  onChange={(e) => setResourceId(Number(e.target.value))}
                  className="w-14 p-1 border border-slate-300 rounded text-center text-xs font-mono font-bold"
                />
                <button
                  onClick={() => fetchFhir(selectedResourceType, resourceId)}
                  className="p-1.5 bg-ayush-700 hover:bg-ayush-800 text-white rounded"
                  title="Fetch"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* JSON Output Viewer */}
            <div className="relative">
              {isFetchingFhir ? (
                <div className="h-96 flex items-center justify-center bg-slate-900 rounded-xl text-white text-xs font-mono">
                  Loading FHIR R4 schema...
                </div>
              ) : fhirError ? (
                <div className="h-96 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-mono">
                  {fhirError}
                </div>
              ) : (
                <pre className="h-96 p-4 bg-slate-950 text-emerald-400 rounded-xl overflow-auto text-[11px] font-mono leading-tight border border-slate-800 shadow-inner">
                  {JSON.stringify(fhirData, null, 2)}
                </pre>
              )}
            </div>

            {/* Specification Footer */}
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>Standard: HL7 FHIR v4.0.1 Specification</span>
              <span className="font-mono text-slate-400">Content-Type: application/fhir+json</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteroperabilityPage;
