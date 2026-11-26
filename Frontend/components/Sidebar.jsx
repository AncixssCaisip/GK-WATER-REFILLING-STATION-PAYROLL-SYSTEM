import BrandLogo from './BrandLogo.jsx'

const ITEMS = [
    ['dash', 'Dashboard', <path key="a" d="M3 11l9-8 9 8M5 10v10h14V10" />],
    ['emp', 'Employees', <path key="a" d="M2.5 20c0-4 3-6 6.5-6s6.5 2 6.5 6M16 4.5a3.5 3.5 0 010 7M18 14c2.5.6 3.5 2.5 3.5 6M9 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" />],
    ['att', 'Attendance', <path key="a" d="M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM3 10h18M8 3v4M16 3v4" />],
    ['pay', 'Payroll', <path key="a" d="M12 3a9 9 0 100 18 9 9 0 000-18zM15 9c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.2 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 5.5v13" />],
    ['set', 'Settings', <path key="a" d="M12 9a3 3 0 100 6 3 3 0 000-6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />],
]

const Sidebar = ({ view, onChange, onLogout }) => {
    return (
        <aside>
            <div className="brand">
                <BrandLogo />
            </div>
            <nav aria-label="Main">
                {ITEMS.map(([key, label, icon]) => (
                    <button key={key} className={view === key ? 'on' : ''} onClick={() => onChange(key)}>
                        <svg viewBox="0 0 24 24">{icon}</svg><span>{label}</span>
                    </button>
                ))}
            </nav>
            <button style={{ marginTop: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }} onClick={onLogout}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                Log out
            </button>
        </aside>
    )
}
export default Sidebar
