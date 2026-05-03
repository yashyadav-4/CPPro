import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

export default function HelpButton() {
  return (
    <Link
      to="/help-support"
      title="Help & Support"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-full shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
    >
      <HelpCircle size={18} className="flex-shrink-0" />
      <span>Help</span>
    </Link>
  );
}
