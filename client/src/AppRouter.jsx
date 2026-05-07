import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
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
const VerifyCodeforces = lazy(() => import('./components/VerifyCodeforces/VerifyCodeforces.jsx'));
const LearningPage = lazy(() => import('./components/LearningTree/LearningPage.jsx'));
const LevelUpPage = lazy(() => import('./components/LevelUp/LevelUpPage.jsx'));
const Settings = lazy(() => import('./components/Settings/Settings.jsx'));
const DailyChallenge = lazy(() => import('./components/DailyChallenge/DailyChallenge.jsx'));

const ContestTracker = lazy(() => import('./components/ContestTracker/ContestTracker.jsx'));
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard.jsx'));
const HelpSupport = lazy(() => import('./components/HelpSupport/HelpSupport.jsx'));
const PublicProfile = lazy(() => import('./components/PublicProfile/PublicProfile.jsx'));

const PageLoader = () => (
  <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const withSuspense = (element) => <Suspense fallback={<PageLoader />}>{element}</Suspense>;

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: withSuspense(<Home />) },
      { path: 'dashboard', element: withSuspense(<ProtectedRoute><Dashboard /></ProtectedRoute>) },
      { path: 'leaderboard', element: withSuspense(<LeaderBoard />) },
      { path: 'level-up', element: withSuspense(<ProtectedRoute><LevelUpPage /></ProtectedRoute>) },
      { path: 'codesnippet', element: withSuspense(<ProtectedRoute><CodeTemplate /></ProtectedRoute>) },
      { path: 'community', element: withSuspense(<Community />) },
      { path: 'verify-codeforces', element: withSuspense(<ProtectedRoute><VerifyCodeforces /></ProtectedRoute>) },
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
    ],
  },
]);

export default router;
