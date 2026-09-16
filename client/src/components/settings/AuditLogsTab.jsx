import React, { useState, useEffect } from 'react';
import Card from '../Card';
import Button from '../Button';
import Badge from '../Badge';
import Input from '../Input';
import Modal from '../Modal';
import { api } from '../../services/api';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Eye, 
  Download, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export const AuditLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const categories = [
    'All',
    'Platform',
    'User & Profile',
    'Roles & Permissions',
    'AI Configuration',
    'Assessment',
    'Proctoring',
    'Training',
    'Communication',
    'Security',
    'System'
  ];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        category: categoryFilter,
        search: searchQuery,
        page,
        limit: 15
      });
      if (res.success) {
        setLogs(res.logs || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [categoryFilter, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportCsv = () => {
    if (!logs.length) return;
    const headers = ['Timestamp', 'Admin Name', 'Admin Email', 'Category', 'Action', 'Setting Changed', 'IP Address'];
    const rows = logs.map(l => [
      new Date(l.timestamp || l.createdAt).toLocaleString(),
      `"${(l.adminName || '').replace(/"/g, '""')}"`,
      `"${(l.adminEmail || '').replace(/"/g, '""')}"`,
      `"${(l.category || '').replace(/"/g, '""')}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.settingChanged || '').replace(/"/g, '""')}"`,
      l.ipAddress || '127.0.0.1'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MITRA_Settings_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInspect = (log) => {
    setSelectedLog(log);
    setInspectModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Search, Filter & Export Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            icon={Search}
            placeholder="Search action, administrator, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="py-1.5 text-xs"
          />
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchLogs}
            title="Refresh logs"
          />

          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleExportCsv}
            disabled={!logs.length}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card
        title={`Audit Trail Records (${total} Total)`}
        subtitle="Immutable chronological history of all administrative settings updates"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Setting Modified</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    Loading audit trail history...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    No settings modification events match your query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp || log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center">
                          {log.adminName ? log.adminName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{log.adminName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{log.adminEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant="primary" className="text-[10px]">
                        {log.category}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 max-w-[180px] truncate">
                      {log.settingChanged || 'General Update'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleInspect(log)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Diff Inspection Modal */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title="Settings Modification Audit Detail"
        maxWidth="max-w-2xl"
        footer={
          <Button variant="outline" size="sm" onClick={() => setInspectModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-bold block">Administrator</span>
                <span className="font-bold text-slate-900">{selectedLog.adminName} ({selectedLog.adminEmail})</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Timestamp & IP</span>
                <span className="font-mono text-slate-700">{new Date(selectedLog.timestamp).toLocaleString()} • {selectedLog.ipAddress}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-bold block mb-1">Action Description</span>
              <span className="font-bold text-slate-900 block">{selectedLog.action}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h5 className="font-bold text-rose-700 mb-1">Previous Configuration</h5>
                <pre className="bg-rose-50/50 border border-rose-200 text-rose-900 p-3 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
                  {selectedLog.previousValue ? JSON.stringify(selectedLog.previousValue, null, 2) : 'None / Initial State'}
                </pre>
              </div>

              <div>
                <h5 className="font-bold text-emerald-700 mb-1">Updated Configuration</h5>
                <pre className="bg-emerald-50/50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
                  {selectedLog.newValue ? JSON.stringify(selectedLog.newValue, null, 2) : 'Updated Value'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogsTab;
