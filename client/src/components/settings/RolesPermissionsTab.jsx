import React, { useState, useEffect } from 'react';
import Card from '../Card';
import Button from '../Button';
import Badge from '../Badge';
import Modal from '../Modal';
import Input from '../Input';
import { api } from '../../services/api';
import { 
  Shield, 
  Plus, 
  Check, 
  Trash2, 
  Edit3, 
  Lock, 
  Users, 
  FileSpreadsheet, 
  BookOpen, 
  FileCheck, 
  Database, 
  Sparkles, 
  Settings,
  AlertCircle
} from 'lucide-react';

export const RolesPermissionsTab = ({ onToast }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    permissions: {
      students: { view: true, create: false, edit: false, delete: false, export: false },
      training: { view: true, create: false, edit: false, delete: false },
      assessments: { view: true, create: false, edit: false, delete: false, export: false },
      questions: { view: true, create: false, edit: false, delete: false, export: false },
      reports: { view: true, export: false },
      aiGenerator: { view: false, generate: false },
      settings: { view: false, edit: false }
    }
  });

  const permissionModules = [
    {
      key: 'students',
      label: 'Student Directory & Records',
      icon: Users,
      actions: ['view', 'create', 'edit', 'delete', 'export']
    },
    {
      key: 'training',
      label: 'Training Modules & Syllabus',
      icon: BookOpen,
      actions: ['view', 'create', 'edit', 'delete']
    },
    {
      key: 'assessments',
      label: 'Assessments & Tests',
      icon: FileCheck,
      actions: ['view', 'create', 'edit', 'delete', 'export']
    },
    {
      key: 'questions',
      label: 'Question Bank Repository',
      icon: Database,
      actions: ['view', 'create', 'edit', 'delete', 'export']
    },
    {
      key: 'reports',
      label: 'Analytics & Placement Reports',
      icon: FileSpreadsheet,
      actions: ['view', 'export']
    },
    {
      key: 'aiGenerator',
      label: 'AI Question & Psychometric Generator',
      icon: Sparkles,
      actions: ['view', 'generate']
    },
    {
      key: 'settings',
      label: 'Administrative Platform Settings',
      icon: Settings,
      actions: ['view', 'edit']
    }
  ];

  const actionLabels = {
    view: 'View',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    export: 'Export',
    generate: 'Generate'
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.getRoles();
      if (res.success && res.roles) {
        setRoles(res.roles);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({
      displayName: '',
      description: '',
      permissions: {
        students: { view: true, create: false, edit: false, delete: false, export: false },
        training: { view: true, create: false, edit: false, delete: false },
        assessments: { view: true, create: false, edit: false, delete: false, export: false },
        questions: { view: true, create: false, edit: false, delete: false, export: false },
        reports: { view: true, export: false },
        aiGenerator: { view: false, generate: false },
        settings: { view: false, edit: false }
      }
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (role) => {
    setEditingRole(role);
    setFormData({
      displayName: role.displayName,
      description: role.description || '',
      permissions: JSON.parse(JSON.stringify(role.permissions || {}))
    });
    setModalOpen(true);
  };

  const handlePermissionToggle = (moduleKey, action) => {
    setFormData(prev => {
      const modulePerms = prev.permissions[moduleKey] || {};
      const nextVal = !modulePerms[action];
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleKey]: {
            ...modulePerms,
            [action]: nextVal
          }
        }
      };
    });
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      if (onToast) onToast('error', 'Validation Error', 'Role name is required.');
      return;
    }

    try {
      setSaving(true);
      if (editingRole) {
        const res = await api.updateRole(editingRole._id, formData);
        if (res.success) {
          if (onToast) onToast('success', 'Role Updated', `Role '${formData.displayName}' updated successfully.`);
          setModalOpen(false);
          await fetchRoles();
        }
      } else {
        const res = await api.createRole(formData);
        if (res.success) {
          if (onToast) onToast('success', 'Role Created', `New role '${formData.displayName}' created successfully.`);
          setModalOpen(false);
          await fetchRoles();
        }
      }
    } catch (err) {
      if (onToast) onToast('error', 'Operation Failed', err.message || 'Error saving role.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      const res = await api.deleteRole(roleToDelete._id);
      if (res.success) {
        if (onToast) onToast('success', 'Role Deleted', `Role '${roleToDelete.displayName}' removed.`);
        setDeleteConfirmOpen(false);
        setRoleToDelete(null);
        await fetchRoles();
      }
    } catch (err) {
      if (onToast) onToast('error', 'Delete Failed', err.message || 'Error deleting role.');
    }
  };

  const countAssignedPermissions = (perms = {}) => {
    let count = 0;
    Object.values(perms).forEach(mod => {
      if (typeof mod === 'object') {
        Object.values(mod).forEach(val => {
          if (val) count++;
        });
      }
    });
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header & Create Role Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Role-Based Access Governance (RBAC)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Assign non-technical, human-readable permissions for college coordinators, placement officers, and faculty
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={handleOpenCreate}
        >
          Create New Role
        </Button>
      </div>

      {/* Role Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const permCount = countAssignedPermissions(role.permissions);

          return (
            <div
              key={role._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-blue-100/70 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-tight">
                        {role.displayName}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {role.name}
                      </span>
                    </div>
                  </div>

                  <Badge variant={role.isSystem ? 'primary' : 'neutral'} className="text-[9px]">
                    {role.isSystem ? 'System' : 'Custom'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 mt-3 line-clamp-2 min-h-[32px]">
                  {role.description || 'No description provided for this role.'}
                </p>

                {/* Permission Highlights Badges */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                    {permCount} Privileges Active
                  </span>
                  {role.permissions?.students?.view && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                      Students
                    </span>
                  )}
                  {role.permissions?.assessments?.create && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                      Exams
                    </span>
                  )}
                  {role.permissions?.aiGenerator?.generate && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">
                      AI Gen
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {role.userCount || 0} user{role.userCount === 1 ? '' : 's'} assigned
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(role)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                    title="Edit Role & Permissions"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {!role.isSystem && (
                    <button
                      type="button"
                      onClick={() => {
                        setRoleToDelete(role);
                        setDeleteConfirmOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete Role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRole ? `Edit Role: ${editingRole.displayName}` : 'Create New Administrative Role'}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              onClick={handleSaveRole}
            >
              Save Role Configuration
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveRole} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Role Display Name *"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="e.g. Campus Placement Officer"
              required
            />
            <Input
              label="Role Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Manages mock drives and aptitude question repository"
            />
          </div>

          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
              Human-Readable Permission Matrix
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Select allowed operations for users assigned to this role. Technical string identifiers are hidden.
            </p>

            <div className="space-y-3">
              {permissionModules.map((mod) => {
                const Icon = mod.icon;
                const modulePerms = formData.permissions[mod.key] || {};

                return (
                  <div
                    key={mod.key}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-[200px]">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">{mod.label}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {mod.actions.map((act) => {
                        const isGranted = Boolean(modulePerms[act]);
                        return (
                          <button
                            key={act}
                            type="button"
                            onClick={() => handlePermissionToggle(mod.key, act)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                              isGranted
                                ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {isGranted && <Check className="w-3 h-3" />}
                            {actionLabels[act] || act}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm Role Deletion"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteRole}
            >
              Delete Role
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-700">
            Are you sure you want to delete the role <strong>{roleToDelete?.displayName}</strong>?
          </p>
          <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
            Users currently assigned to this role will lose associated permissions immediately.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default RolesPermissionsTab;
