import { Outlet } from "react-router-dom";
import Header from './components/Header/Header'
import Footer from "./components/Footer/Footer";

function Layout() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
            <Header />
            <main className="min-h-[calc(100vh-64px)]">
                <Outlet />
            </main>
            <Footer/>
        </div>
    )
}

export default Layout;