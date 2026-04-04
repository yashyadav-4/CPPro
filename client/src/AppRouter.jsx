import { createBrowserRouter } from 'react-router-dom'
import Layout from './Layout.jsx'
import Login from './components/AuthPage/Login'
import Signup from './components/AuthPage/Signup.jsx'
import Home from './components/Home/Home.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import LeaderBoard from './components/Leaderboard/Leaderboard.jsx'
import CodeTemplate from './components/CodeTemplate/CodeTemplate.jsx'
import Community from './components/Community Page/Community.jsx'
import VerifyCodeforces from './components/VerifyCodeforces/VerifyCodeforces.jsx'
import LearningPage from './components/Learning/LearningPage.jsx'
import LevelUpPage from './components/LevelUp/LevelUpPage.jsx'

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                index: true,
                element: <Home/>
            },
            {
                path: "dashboard",
                element: <ProtectedRoute><Dashboard /></ProtectedRoute>
            },
            {
                path: "leaderboard",
                element: <ProtectedRoute><LeaderBoard /></ProtectedRoute>
            },

            {
                path: "level-up",
                element: <ProtectedRoute><LevelUpPage /></ProtectedRoute>
            },
            {
                path: "codesnippet",
                element: <ProtectedRoute> <CodeTemplate /> </ProtectedRoute>
            },
            {
                path: "community",
                element: <Community />
            },
            {
                path: "verify-codeforces",
                element: <ProtectedRoute><VerifyCodeforces /></ProtectedRoute>
            },
            {
                path: "learning",
                element: <ProtectedRoute><LearningPage /></ProtectedRoute>
            }
        ]
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/signup",
        element: <Signup />
    }
]);

export default router;