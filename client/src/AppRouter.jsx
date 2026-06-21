import { lazy, Suspense } from 'react';
import { createBrowserRouter, useRouteError } from 'react-router-dom';
import Layout from './Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

const Home = lazy(() => import('./components/Home/Home.jsx'));
const Login = lazy(() => import('./components/AuthPage/Login'));
const Signup = lazy(() => import('./components/AuthPage/Signup.jsx'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard.jsx'));
const LeaderBoard = lazy(() => import('./components/Leaderboard/Leaderboard.jsx'));
const CodeTemplate = lazy(() => import('./components/CodeTemplate/CodeTemplate.jsx'));
const Community = lazy(() => import('./components/Community Page/Community.jsx'));
const Verification = lazy(() => import('./components/Verification/Verification.jsx'));
const LearningPage = lazy(() => import('./components/LearningTree/LearningPage.jsx'));
const LevelUpPage = lazy(() => import('./components/LevelUp/LevelUpPage.jsx'));
const Settings = lazy(() => import('./components/Settings/Settings.jsx'));
const DailyChallenge = lazy(() => import('./components/DailyChallenge/DailyChallenge.jsx'));

const ContestTracker = lazy(() => import('./components/ContestTracker/ContestTracker.jsx'));
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard.jsx'));
const HelpSupport = lazy(() => import('./components/HelpSupport/HelpSupport.jsx'));
const PublicProfile = lazy(() => import('./components/PublicProfile/PublicProfile.jsx'));
const NotFound = lazy(() => import('./components/NotFound/NotFound.jsx'));

import { RefreshCw } from 'lucide-react';

const PageLoader = () => (
  <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex justify-center items-center">
    <RefreshCw size={24} className="animate-spin text-emerald-500" />
  </div>
);

const withSuspense = (element) => <Suspense fallback={<PageLoader />}>{element}</Suspense>;

function GlobalErrorBoundary() {
  const error = useRouteError();
  
  // If Vite chunks fail to load due to a stale cache or new deployment, reload the page.
  if (error && error.message && (error.message.includes('Failed to fetch dynamically imported module') || error.message.includes('Importing a module script failed'))) {
    window.location.reload();
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Oops! Something went wrong.</h1>
      <p className="text-gray-500 mb-6">{error?.message || "An unexpected error occurred."}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium"
      >
        Refresh Page
      </button>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <GlobalErrorBoundary />,
    children: [
      { index: true, element: withSuspense(<Home />) },
      { path: 'dashboard', element: withSuspense(<ProtectedRoute><Dashboard /></ProtectedRoute>) },
      { path: 'leaderboard', element: withSuspense(<LeaderBoard />) },
      { path: 'level-up', element: withSuspense(<ProtectedRoute><LevelUpPage /></ProtectedRoute>) },
      { path: 'codesnippet', element: withSuspense(<ProtectedRoute><CodeTemplate /></ProtectedRoute>) },
      { path: 'community', element: withSuspense(<Community />) },
      { path: 'verification', element: withSuspense(<ProtectedRoute><Verification /></ProtectedRoute>) },
      { path: 'learning', element: withSuspense(<ProtectedRoute><LearningPage /></ProtectedRoute>) },
      { path: 'learning/cp', element: withSuspense(<ProtectedRoute><LearningPage /></ProtectedRoute>) },
      { path: 'learning/dsa', element: withSuspense(<ProtectedRoute><LearningPage /></ProtectedRoute>) },
      { path: 'learning/resources', element: withSuspense(<ProtectedRoute><LearningPage /></ProtectedRoute>) },
      { path: 'settings', element: withSuspense(<ProtectedRoute><Settings /></ProtectedRoute>) },
      { path: 'daily', element: withSuspense(<ProtectedRoute><DailyChallenge /></ProtectedRoute>) },

      { path: 'contest-tracker', element: withSuspense(<ContestTracker />) },
      { path: 'help-support', element: withSuspense(<HelpSupport />) },
      { path: 'user/:username', element: withSuspense(<PublicProfile />) },
      { path: 'admin', element: withSuspense(<AdminRoute><AdminDashboard /></AdminRoute>) },
      { path: 'login', element: withSuspense(<Login />) },
      { path: 'signup', element: withSuspense(<Signup />) },
      { path: '*', element: withSuspense(<NotFound />) },
    ],
  },
]);

export default router;
