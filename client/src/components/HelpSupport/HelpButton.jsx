import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

export default function HelpButton() {
  return (
    <Link
      to="/help-support"
      title="Help & Support"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-full shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
    >
      <HelpCircle size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
      <span>Help</span>
    </Link>
  );
}
