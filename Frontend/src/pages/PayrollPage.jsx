import { useEffect, useState } from 'react';
import { api, peso } from '../api';

function getKinsenas() {
  const now  = new Date()
  const y    = now.getFullYear()
  const m    = String(now.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    first:  { start: `${y}-${m}-01`, end: `${y}-${m}-15` },
    second: { start: `${y}-${m}-16`, end: `${y}-${m}-${last}` },
  }
}

const PayrollPage = () => {
  const kinsenas = getKinsenas()
  const [tab,     setTab]     = useState('compute')   // 'compute' | 'history'
  const [start,   setStart]   = useState(kinsenas.first.start)
  const [end,     setEnd]     = useState(kinsenas.first.end)
  const [payroll, setPayroll] = useState(null)
  const [error,   setError]   = useState('')
  const [history, setHistory] = useState([])
  const [viewPeriod, setViewPeriod] = useState(null)  // approved period detail

  // Cash advance modal
  const [caModal, setCaModal]     = useState(false)
  const [employees, setEmployees] = useState([])
  const [caForm, setCaForm]       = useState({ employee_id: '', amount: '', note: '' })
  const [caErr,  setCaErr]        = useState('')

  useEffect(() => {
    if (tab === 'history') loadHistory()
    if (tab === 'compute') {
      api('/employees').then(setEmployees).catch(() => {})
    }
  }, [tab])

  async function loadHistory() {
    try { setHistory(await api('/payroll/history')) }
    catch (e) { setError(e.message) }
  }

  const calculate = async () => {
    if (!start || !end) return setError('Select a period start and end date.')
    if (start > end)    return setError('Period start must be before period end.')
    setError('')
    try {
      setPayroll(await api('/payroll/calculate', 'POST', { period_start: start, period_end: end }))
    } catch (e) { setError(e.message) }
  }

  const approve = async () => {
    if (!payroll?.period_id) return
    try {
      await api(`/payroll/approve/${payroll.period_id}`, 'PUT')
      setPayroll({ ...payroll, status: 'Approved' })
      setError('')
    } catch (e) { setError(e.message) }
  }

  const viewHistory = async (id) => {
    try {
      setViewPeriod(await api(`/payroll/period/${id}`))
      setTab('view')
    } catch (e) { setError(e.message) }
  }

  const addCashAdvance = async (e) => {
    e.preventDefault()
    setCaErr('')
    try {
      await api('/payroll/cash-advance', 'POST', {
        ...caForm,
        employee_id: Number(caForm.employee_id),
        amount: Number(caForm.amount),
        period_start: start,
        period_end: end,
      })
      setCaModal(false)
      setCaForm({ employee_id: '', amount: '', note: '' })
      // Recompute to reflect new cash advance
      if (payroll) calculate()
    } catch (e) { setCaErr(e.message) }
  }

  return (
    <>
      {/* Tabs */}
      <div className="bar">
        <h2 style={{ margin: 0 }}>Payroll</h2>
        <span className="sp" />
        <button className={`btn sm ${tab === 'compute' ? 'sky' : 'ghost'}`} onClick={() => setTab('compute')}>Compute Payroll</button>
        <button className={`btn sm ${tab === 'history' ? 'sky' : 'ghost'}`} onClick={() => setTab('history')}>Payroll History</button>
      </div>

      {/* ── COMPUTE TAB ── */}
      {tab === 'compute' && (
        <>
          {/* Period picker */}
          <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 4 }}>Period Start</label>
              <input type="date" value={start}
                onChange={(e) => { setStart(e.target.value); setPayroll(null) }}
                style={{ height: 38, border: '2px solid var(--border)', borderRadius: 8, padding: '0 10px', font: 'inherit', fontSize: 14 }} />
            </div>
            <div style={{ fontSize: 18, color: 'var(--mu)', paddingBottom: 4 }}>→</div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mu)', marginBottom: 4 }}>Period End</label>
              <input type="date" value={end}
                onChange={(e) => { setEnd(e.target.value); setPayroll(null) }}
                style={{ height: 38, border: '2px solid var(--border)', borderRadius: 8, padding: '0 10px', font: 'inherit', fontSize: 14 }} />
            </div>
            <button className="btn sky" onClick={calculate}>Compute payroll</button>
            {payroll && payroll.status !== 'Approved' && (
              <button className="btn" style={{ background: 'var(--good, #18794e)' }} onClick={approve}>
                ✓ Approve payroll
              </button>
            )}
            {payroll && (
              <button className="btn ghost" onClick={() => setCaModal(true)}>+ Cash advance</button>
            )}
            {payroll?.status && (
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                background: payroll.status === 'Approved' ? '#d1fae5' : '#fef3c7',
                color: payroll.status === 'Approved' ? '#18794e' : '#92400e',
              }}>
                {payroll.status}
              </span>
            )}
          </div>

          {/* Payroll table */}
          <div className="card">
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Basic</th><th>Allowance</th>
                    <th>Commission</th><th>Deduction</th><th>Cash Advance</th><th>Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {payroll?.rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.id}</td><td>{r.name}</td>
                      <td>{peso(r.basic)}</td><td>{peso(r.allowance)}</td>
                      <td>{peso(r.commission)}</td><td>{peso(r.deduction)}</td>
                      <td>{peso(r.cash_advance)}</td><td><b>{peso(r.net)}</b></td>
                    </tr>
                  ))}
                  {payroll && !payroll.rows.length && (
                    <tr><td colSpan="8" className="empty">No active employees.</td></tr>
                  )}
                  {!payroll && (
                    <tr><td colSpan="8" className="empty">Select a period and click Compute payroll.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="err" role="alert">{error}</p>
            <p style={{ color: 'var(--mu)', fontSize: 13, margin: '10px 0 0' }}>
              Deduction = undertime hours × hourly rate. Net = Basic + Allowance + Commission − Deduction − Cash Advance.
            </p>
            <div style={{ textAlign: 'right', fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginTop: 8 }}>
              Total payroll: {peso(payroll?.total_payroll || 0)}
            </div>
          </div>
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div className="card">
          <div className="tw">
            <table>
              <thead>
                <tr><th>Period</th><th>Total Payroll</th><th>Status</th><th>Approved At</th><th></th></tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{h.period_start} → {h.period_end}</td>
                    <td>{peso(h.total_payroll)}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: h.status === 'Approved' ? '#d1fae5' : '#fef3c7',
                        color: h.status === 'Approved' ? '#18794e' : '#92400e',
                      }}>{h.status}</span>
                    </td>
                    <td>{h.approved_at ? new Date(h.approved_at).toLocaleDateString('en-PH') : '—'}</td>
                    <td><button className="btn sm ghost" onClick={() => viewHistory(h.id)}>View</button></td>
                  </tr>
                ))}
                {!history.length && <tr><td colSpan="5" className="empty">No payroll history yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="err">{error}</p>
        </div>
      )}

      {/* ── VIEW PERIOD TAB ── */}
      {tab === 'view' && viewPeriod && (
        <>
          <div className="bar">
            <button className="btn ghost sm" onClick={() => setTab('history')}>← Back to history</button>
            <span style={{ fontSize: 14, color: 'var(--mu)' }}>
              {viewPeriod.period_start} → {viewPeriod.period_end}
            </span>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: viewPeriod.status === 'Approved' ? '#d1fae5' : '#fef3c7',
              color: viewPeriod.status === 'Approved' ? '#18794e' : '#92400e',
            }}>{viewPeriod.status}</span>
          </div>
          <div className="card">
            <div className="tw">
              <table>
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Basic</th><th>Allowance</th><th>Commission</th><th>Deduction</th><th>Cash Advance</th><th>Net Salary</th></tr>
                </thead>
                <tbody>
                  {viewPeriod.rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.emp_code}</td><td>{r.name}</td>
                      <td>{peso(r.basic)}</td><td>{peso(r.allowance)}</td>
                      <td>{peso(r.commission)}</td><td>{peso(r.deduction)}</td>
                      <td>{peso(r.cash_advance)}</td><td><b>{peso(r.net)}</b></td>
                    </tr>
                  ))}
                  {!viewPeriod.rows.length && <tr><td colSpan="8" className="empty">No records.</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'right', fontSize: 22, fontWeight: 700, color: 'var(--navy)', marginTop: 8 }}>
              Total payroll: {peso(viewPeriod.total_payroll)}
            </div>
          </div>
        </>
      )}

      {/* ── Cash Advance Modal ── */}
      {caModal && (
        <div className="mask">
          <div className="card" role="dialog" style={{ maxWidth: 400 }}>
            <h3>Add Cash Advance</h3>
            <p style={{ fontSize: 13, color: 'var(--mu)', margin: '4px 0 12px' }}>
              Period: {start} → {end}
            </p>
            <form onSubmit={addCashAdvance}>
              <label>Employee</label>
              <select value={caForm.employee_id} onChange={(e) => setCaForm({ ...caForm, employee_id: e.target.value })} required>
                <option value="">Select employee</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.emp_code})</option>)}
              </select>
              <label>Amount (₱)</label>
              <input type="number" min="1" step="any" value={caForm.amount}
                onChange={(e) => setCaForm({ ...caForm, amount: e.target.value })} required />
              <label>Note (optional)</label>
              <input type="text" value={caForm.note}
                onChange={(e) => setCaForm({ ...caForm, note: e.target.value })}
                placeholder="e.g. Advance for November" />
              {caErr && <p className="err">{caErr}</p>}
              <div className="row">
                <button type="button" className="btn ghost" onClick={() => setCaModal(false)}>Cancel</button>
                <button type="submit" className="btn sky">Add cash advance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default PayrollPage
