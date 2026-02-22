import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import Classes from './pages/admin/Classes';
import Students from './pages/admin/Students';
import StudentProfile from './pages/admin/StudentProfile';
import Curriculum from './pages/admin/Curriculum';
import AdminLessons from './pages/admin/Lessons';
import AdminAssignments from './pages/admin/Assignments';
import AdminAnnouncements from './pages/admin/Announcements';
import Grading from './pages/admin/Grading';
import Reports from './pages/admin/Reports';
import ResourceBank from './pages/admin/ResourceBank';
import RegularAssessment from './pages/admin/RegularAssessment';
import StudentDashboard from './pages/student/Dashboard';
import StudentLessons from './pages/student/Lessons';
import LessonDetail from './pages/student/LessonDetail';
import StudentAssignments from './pages/student/Assignments';
import AssignmentDetail from './pages/student/AssignmentDetail';
import StudentProgress from './pages/student/Progress';
import StudentGames from './pages/student/Games';
import { UserRole } from './types';
import { NetworkStatusNotification } from './components/NetworkStatus';

// Layout Component to wrap authenticated routes
const MainLayout: React.FC<{ allowedRole: UserRole }> = ({ allowedRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (user.role !== allowedRole) {
     // Redirect to correct dashboard if role mismatch
     return <Navigate to={user.role === UserRole.TEACHER ? '/admin/dashboard' : '/app/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Topbar 
        user={user} 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <div className="flex flex-1 relative">
        <Sidebar 
          role={user.role} 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <main className="flex-1 w-full lg:w-[calc(100%-16rem)] p-4 lg:p-0 overflow-y-auto h-[calc(100vh-64px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Inner App to use `useAuth` (which requires Router context, but here AuthProvider is inside Router)
// Actually, AuthProvider usually needs `useNavigate` so it must be inside Router.
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Teacher Routes */}
      <Route path="/admin" element={<MainLayout allowedRole={UserRole.TEACHER} />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="classes" element={<Classes />} />
        <Route path="students" element={<Students />} />
        <Route path="students/:id" element={<StudentProfile />} />
        <Route path="curriculum" element={<Curriculum />} />
        <Route path="lessons" element={<AdminLessons />} />
        <Route path="resources" element={<ResourceBank />} />
        <Route path="assignments" element={<AdminAssignments />} />
        <Route path="assignments/:id/grade" element={<Grading />} />
        <Route path="regular-assessment" element={<RegularAssessment />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="reports" element={<Reports />} />
        <Route index element={<Navigate to="dashboard" />} />
      </Route>

      {/* Student Routes */}
      <Route path="/app" element={<MainLayout allowedRole={UserRole.STUDENT} />}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="lessons" element={<StudentLessons />} />
        <Route path="lessons/:id" element={<LessonDetail />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="assignments/:id" element={<AssignmentDetail />} />
        <Route path="games" element={<StudentGames />} />
        <Route path="progress" element={<StudentProgress />} />
        <Route index element={<Navigate to="dashboard" />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
         <NetworkStatusNotification />
         <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;