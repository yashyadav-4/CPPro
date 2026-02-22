import { createBrowserRouter } from 'react-router-dom'
import Layout from './Layout.jsx'
import Login from './components/AuthPage/Login'
import Signup from './components/AuthPage/Signup.jsx'
import Home from './components/Home/Home.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './components/Dashboard/Dashboard.jsx'
import LeaderBoard from './components/Leaderboard/Leaderboard.jsx'
import CodeTemplate from './components/CodeTemplate/CodeTemplate.jsx'
import SnippetDetail from './components/CodeTemplate/SnippetDetail.jsx'

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                index: true,
                element: <ProtectedRoute><Home /></ProtectedRoute>
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
                path: "CodeTemplate",
                element: <ProtectedRoute> <CodeTemplate /> </ProtectedRoute>
            },
            {
                path: "CodeTemplate/:id",
                element: <ProtectedRoute> <SnippetDetail /> </ProtectedRoute>
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