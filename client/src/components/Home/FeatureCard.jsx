export default function FeatureCard({ icon: Icon, title, description, color = "indigo" }) {
    const colorStyles = {
        indigo: "bg-indigo-50 text-indigo-600",
        teal: "bg-teal-50 text-teal-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        yellow: "bg-yellow-50 text-yellow-600",
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-left transition-all duration-300 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${colorStyles[color] || colorStyles.indigo}`}>
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
    )
}
