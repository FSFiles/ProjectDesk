import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, ArrowRight, Search } from 'lucide-react';
import { projectService } from '../../services/project.service.js';
import Card from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { SlowNetworkIndicator, Spinner } from '../../components/ui/Loading.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/ui/Toast.jsx';

export default function ProjectAccess() {
  const navigate = useNavigate();
  const toast = useToast();
  const { slow } = useAuth();
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const id = projectId.trim().toUpperCase();
    if (!id) {
      setError('Project ID is required');
      return;
    }
    if (!/^PD-PRJ-[A-Z2-9]{8}$/.test(id)) {
      setError('That does not look like a valid Project ID. The format is PD-PRJ-XXXXXXXX (e.g. PD-PRJ-K7M4X9Q2).');
      return;
    }
    setChecking(true);
    try {
      // Resolve first; on success navigate to the detail page.
      await projectService.access(id);
      navigate(`/student/project/${id}`);
    } catch (err) {
      setError(err.friendlyMessage || 'We could not find this project.');
      setChecking(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">Access a Project</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Enter the Project ID shared by your faculty to view project details, instructions and available titles.
        </p>
      </div>

      <SlowNetworkIndicator visible={slow && checking} />

      <Card className="mt-4">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Input
            label="Project ID"
            placeholder="PD-PRJ-K7M4X9Q2"
            icon={Hash}
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value.toUpperCase());
              setError('');
            }}
            error={error}
            hint="Format: PD-PRJ-XXXXXXXX — ask your faculty if you are unsure."
            autoComplete="off"
            className="font-mono tracking-wider"
            required
          />
          <Button type="submit" size="lg" className="w-full" loading={checking} icon={Search}>
            {checking ? 'Checking Project ID…' : 'View Project'}
          </Button>
        </form>
      </Card>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-card">
        <p className="font-medium text-navy-900">Where do I find this?</p>
        <p className="mt-1 leading-relaxed">
          Your faculty shares the Project ID (it looks like <span className="font-mono font-semibold text-navy-900">PD-PRJ-K7M4X9Q2</span>) after creating the project.
          Copy it exactly — it is case-insensitive.
        </p>
      </div>

      {checking && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
          <Spinner size={15} /> Resolving project…
        </div>
      )}
      <div className="mt-6 text-center">
        <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
