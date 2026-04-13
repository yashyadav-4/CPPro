import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Header from './components/Header/Header'
import Footer from "./components/Footer/Footer";
import LoadingScreen from "./components/common/LoadingScreen";

function Layout() {
    const location = useLocation();
    const isAuthPage = ['/login', '/signup'].includes(location.pathname);

    const [isLoading, setIsLoading] = useState(() => {
        const lastShown = localStorage.getItem('loader-last-shown');
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        
        if (!lastShown) return true;
        
        const timePassed = Date.now() - parseInt(lastShown);
        return timePassed > TWENTY_FOUR_HOURS;
    });

    const handleLoadingComplete = () => {
        setIsLoading(false);
        localStorage.setItem('loader-last-shown', Date.now().toString());
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white flex flex-col">
            <AnimatePresence mode="wait">
                {isLoading && (
                    <LoadingScreen key="loader" onComplete={handleLoadingComplete} />
                )}
            </AnimatePresence>

            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            {!isAuthPage && <Footer/>}
        </div>
    )
}

export default Layout;