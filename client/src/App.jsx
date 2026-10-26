import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import Modal from './components/ui/Modal.jsx';
import Button from './components/ui/Button.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import { RequireRole } from './routes/ProtectedRoute.jsx';

import LandingPage from './pages/LandingPage.jsx';
import StudentLogin from './pages/auth/StudentLogin.jsx';
import StudentRegister from './pages/auth/StudentRegister.jsx';
import FacultyLogin from './pages/auth/FacultyLogin.jsx';

import StudentDashboard from './pages/student/StudentDashboard.jsx';
import ProjectAccess from './pages/student/ProjectAccess.jsx';
import StudentProjectDetail from './pages/student/StudentProjectDetail.jsx';
import TeamCreate from './pages/student/TeamCreate.jsx';
import TeamJoin from './pages/student/TeamJoin.jsx';
import MyTeam from './pages/student/MyTeam.jsx';
import StudentStatus from './pages/student/StudentStatus.jsx';
import ProfilePage from './pages/shared/ProfilePage.jsx';
import SettingsPage from './pages/shared/SettingsPage.jsx';

import FacultyDashboard from './pages/faculty/FacultyDashboard.jsx';
import FacultyProjects from './pages/faculty/FacultyProjects.jsx';
import FacultyProjectCreate from './pages/faculty/FacultyProjectCreate.jsx';
import FacultyProjectDetail from './pages/faculty/FacultyProjectDetail.jsx';
import FacultyTeams from './pages/faculty/FacultyTeams.jsx';
import FacultyTeamDetail from './pages/faculty/FacultyTeamDetail.jsx';
import FacultyApprovals from './pages/faculty/FacultyApprovals.jsx';
import FacultyMonitoring from './pages/faculty/FacultyMonitoring.jsx';

/** Global session-expired dialog (fires on any 401 from the API layer). */
function SessionExpiredModal() {
  const { sessionExpired, dismissSessionExpired } = useAuth();
  return (
    <Modal open={Boolean(sessionExpired)} onClose={dismissSessionExpired} title="Session Expired" size="sm">
      <p className="text-sm text-slate-600">{sessionExpired || 'Your session has expired. Please log in again.'}</p>
      <div className="mt-5 flex justify-end">
        <Button onClick={() => window.location.assign('/student/login')}>Login</Button>
      </div>
    </Modal>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SessionExpiredModal />
          <Routes>
            <Route path="/" element={<LandingPage />} />

            {/* Auth (each page brings its own split-screen shell) */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/register" element={<StudentRegister />} />
            <Route path="/faculty/login" element={<FacultyLogin />} />

            {/* Student portal */}
            <Route
              path="/student"
              element={
                <RequireRole role="student">
                  <DashboardLayout role="student" />
                </RequireRole>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="project/access" element={<ProjectAccess />} />
              <Route path="project/:projectId" element={<StudentProjectDetail />} />
              <Route path="team" element={<MyTeam />} />
              <Route path="team/create" element={<TeamCreate />} />
              <Route path="team/join" element={<TeamJoin />} />
              <Route path="status" element={<StudentStatus />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Faculty portal */}
            <Route
              path="/faculty"
              element={
                <RequireRole role="faculty">
                  <DashboardLayout role="faculty" />
                </RequireRole>
              }
            >
              <Route index element={<FacultyDashboard />} />
              <Route path="dashboard" element={<FacultyDashboard />} />
              <Route path="projects" element={<FacultyProjects />} />
              <Route path="projects/create" element={<FacultyProjectCreate />} />
              <Route path="projects/:projectId" element={<FacultyProjectDetail />} />
              <Route path="teams" element={<FacultyTeams />} />
              <Route path="teams/:teamId" element={<FacultyTeamDetail />} />
              <Route path="approvals" element={<FacultyApprovals />} />
              <Route path="monitoring" element={<FacultyMonitoring />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
