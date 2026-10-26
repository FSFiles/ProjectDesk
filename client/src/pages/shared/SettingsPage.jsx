import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authService } from '../../services/auth.service.js';
import Card, { CardHeader } from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { SlowNetworkIndicator } from '../../components/ui/Loading.jsx';
import { Bell, ShieldCheck, LogOut, Wifi, Camera, Trash2, Check, ImageUp } from 'lucide-react';

const ACCEPT = 'image/png,image/jpeg,image/webp';
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB (mirrors the server rule)

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-navy-900">{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-ring ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function ProfilePhotoCard() {
  const { user, updateUser, slow } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  const savedUrl = user?.profileImage?.url || null;
  const [preview, setPreview] = useState(null); // local object URL shown before saving
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  if (!user) return null;

  const openPicker = () => fileInputRef.current?.click();

  const clearPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreview(null);
  };

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Validate BEFORE uploading and show an instant local preview.
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    resetInput();
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Invalid image format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error('Image is too large. Please upload an image smaller than 5 MB.');
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreview({ url, file });
  };

  const savePhoto = async () => {
    if (!preview || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', preview.file);
      const { user: updated } = await authService.uploadPhoto(formData);
      updateUser({ ...user, profileImage: updated.profileImage });
      clearPreview();
      toast.success('Profile photo updated successfully.');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to upload profile photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    if (removing || uploading) return;
    setRemoving(true);
    try {
      const { user: updated } = await authService.removePhoto();
      updateUser({ ...user, profileImage: updated.profileImage });
      clearPreview();
      toast.success('Profile photo removed');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Unable to remove profile photo. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  // Preview (selected file) wins over the saved photo; Avatar falls back to initials.
  const shown = preview ? { ...user, profileImage: { url: preview.url } } : user;

  return (
    <Card>
      <CardHeader title="Profile Photo" icon={Camera} subtitle="A circular photo shown across your portal." />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex flex-col items-center gap-1.5">
          <Avatar user={shown} size="xl" />
          {!savedUrl && !preview && <span className="text-xs text-slate-400">No profile photo uploaded</span>}
          {preview && <span className="text-xs text-brand-600 font-medium">Preview — not saved yet</span>}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          {preview ? (
            <>
              <p className="text-sm text-slate-500">
                Looks good? Save to apply it everywhere, or pick a different image.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={savePhoto} loading={uploading} icon={!uploading ? Check : undefined}>
                  {uploading ? 'Uploading…' : 'Save Photo'}
                </Button>
                <Button variant="ghost" onClick={clearPreview} disabled={uploading}>
                  Cancel
                </Button>
              </div>
              <SlowNetworkIndicator visible={slow && uploading} />
            </>
          ) : savedUrl ? (
            <>
              <p className="text-sm text-slate-500">
                JPG, JPEG, PNG or WEBP — up to 5 MB.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" icon={ImageUp} onClick={openPicker} disabled={uploading || removing}>
                  Change Photo
                </Button>
                <Button variant="danger" icon={Trash2} loading={removing} onClick={removePhoto}>
                  Remove Photo
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500">
                Upload a photo to personalise your account. JPG, JPEG, PNG or WEBP — up to 5 MB.
              </p>
              <Button icon={ImageUp} onClick={openPicker} disabled={uploading || removing}>
                Upload Photo
              </Button>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onFileChange}
        aria-label="Choose a profile photo"
      />
    </Card>
  );
}

export default function SettingsPage() {
  const { logout, socketConnected, unreadCount } = useAuth();
  const toast = useToast();
  const [prefs, setPrefs] = useState({
    teamUpdates: true,
    approvals: true,
    joins: true,
    live: true,
  });

  const set = (k) => (v) => {
    setPrefs((p) => ({ ...p, [k]: v }));
    toast.success('Preference saved');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-navy-950">Settings</h1>
        <p className="mt-1.5 text-sm text-slate-500">Notification preferences and session information.</p>
      </div>

      <ProfilePhotoCard />

      <Card>
        <CardHeader title="Notifications" icon={Bell} subtitle="Choose what you want to be notified about." />
        <div className="divide-y divide-slate-100">
          <Toggle label="Team updates" description="Member joins and team changes" checked={prefs.teamUpdates} onChange={set('teamUpdates')} />
          <Toggle label="Approval decisions" description="Approvals, rejections and change requests" checked={prefs.approvals} onChange={set('approvals')} />
          <Toggle label="Project events" description="New projects and title allocations" checked={prefs.joins} onChange={set('joins')} />
          <Toggle label="Live updates" description="Real-time delivery while ProjectDesk is open" checked={prefs.live} onChange={set('live')} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Connection" icon={Wifi} subtitle="Live updates use a secure socket connection." />
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3.5">
          <div className="flex items-center gap-2.5 text-sm">
            <span className={`h-2 w-2 rounded-full ${socketConnected ? 'bg-teal-500' : 'bg-slate-300'}`} aria-hidden />
            <span className="font-medium text-navy-900">{socketConnected ? 'Connected — live updates active' : 'Reconnecting…'}</span>
          </div>
          {unreadCount > 0 && <Badge tone="amber">{unreadCount} unread</Badge>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Session" icon={ShieldCheck} subtitle="Signed in with a secure JWT session." />
        <Button variant="danger" icon={LogOut} onClick={() => {
          logout();
          window.location.assign('/');
        }}>
          Log out of ProjectDesk
        </Button>
      </Card>
    </div>
  );
}
