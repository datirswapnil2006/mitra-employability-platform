import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Select from '../../components/Select';
import LoadingState from '../../components/LoadingState';
import { BookOpen, Layers, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrainingPublicPage = () => {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [category, setCategory] = useState('All');
  const [department, setDepartment] = useState('All');

  const categories = ['All', 'Aptitude', 'Domain Knowledge', 'Communication', 'Resume', 'Interview', 'Technical Coding', 'SQL'];
  const departments = ['All', 'EXTC', 'CSE', 'IT', 'Mechanical', 'Civil', 'CSE-IoT', 'AI & DS', 'MBA', 'MCA'];

  useEffect(() => {
    fetchModules();
  }, [category, department]);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (department !== 'All') params.department = department;

      const res = await api.getModules(params);
      if (res.success) {
        setModules(res.modules || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="primary">Curriculum Catalog</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Explore Employability Training Modules
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed">
          Browse our structured courses across aptitude, SQL, technical coding, and domain engineering. Sign in to track submodule progress and unlock assessments.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                category === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full md:w-56">
          <Select
            label="Filter by Department"
            options={departments}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
      </div>

      {/* Modules Grid */}
      {loading ? (
        <LoadingState message="Loading curriculum modules..." />
      ) : modules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <Card key={mod._id} className="flex flex-col justify-between h-full hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="primary">{mod.category}</Badge>
                  <Badge variant="neutral">{mod.departments ? mod.departments.join(', ') : 'All'}</Badge>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{mod.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">{mod.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold">Submodule Curriculum</span>
                <Link to="/register">
                  <Button size="sm" variant="primary" icon={ArrowRight}>
                    Enroll / Start
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
          No training modules found for the selected filter.
        </div>
      )}
    </div>
  );
};

export default TrainingPublicPage;
