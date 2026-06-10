import { Link } from "react-router-dom";
import { SearchX, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] px-6 py-20">
      <div className="text-center max-w-lg">
        {/* Animated icon or decorative element */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
            <div className="relative bg-white dark:bg-[#111111] p-5 rounded-3xl border border-gray-200 dark:border-white/[0.08] shadow-sm">
              <SearchX size={48} className="text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Text content */}
        <h1 className="text-6xl sm:text-7xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
          4<span className="text-emerald-500">0</span>4
        </h1>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed max-w-sm mx-auto">
          We couldn't find the page you're looking for. It might have been moved, deleted, or perhaps the URL is incorrect.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all duration-200"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          
          <Link 
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow transition-all duration-200"
          >
            <Home size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
