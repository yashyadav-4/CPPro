export default function FeatureCard({ icon: Icon, title, description, color = "blue" }) {
    return (
        <div className="feature-card">
            <div className={`feature-icon ${color}`}>
                <Icon size={22} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    )
}
