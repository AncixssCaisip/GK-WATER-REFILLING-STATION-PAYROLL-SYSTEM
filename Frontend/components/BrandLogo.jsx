// Shared brand logo — used in all dashboards (Admin, Employee, Driver, Customer)
function BrandLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg viewBox="0 0 46 60" aria-hidden="true" width="32" height="44">
        <path d="M23 2C23 2 3 26 3 39a20 20 0 0 0 40 0C43 26 23 2 23 2z" fill="#29a9e1" />
      </svg>
      <div style={{ lineHeight: 1.1 }}>
        <span style={{
          display: 'block',
          fontSize: 22,
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-0.5px',
          fontFamily: '"Segoe UI", Arial, sans-serif',
        }}>GK</span>
        <span style={{
          display: 'block',
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.8)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontFamily: '"Segoe UI", Arial, sans-serif',
        }}>Refilling Station</span>
      </div>
    </div>
  )
}

export default BrandLogo
