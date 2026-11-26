import { useEffect, useState } from 'react';
import { api, attempt } from '../api';
import Modal from '../components/Modal';
import Pager from '../components/Pager';
import QrModal from '../components/QrModal';

const TOP = [['name', 'Full name'], ['position', 'Position', 'sel', ['Staff', 'Driver']]];
const BOTTOM = [
    ['basic_salary', 'Basic salary (monthly ₱)', 'number'],
    ['status', 'Status', 'sel', ['Active', 'Inactive']],
];
const ACCOUNT = [['username', 'Username (for the employee account)'], ['password', 'Password (at least 8 characters)', 'password']];
const RESET = [['password', 'New password (leave blank to keep)', 'password']];
const BLANK = { status: 'Active', role: 'employee', position: 'Staff', basic_salary: 0 };

// New employee (or one without an account yet) gets the account fields; others can only reset the password
const fieldsFor = (e) => [...TOP, ...(!e.id || !e.username ? ACCOUNT : RESET), ...BOTTOM];

const EmployeePage = () => {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState(null);     // an employee, BLANK for a new one, or null
    const [deleting, setDeleting] = useState(null);
    const [qr, setQr] = useState(null);

    const load = () => api('/employees').then(setEmployees).catch((e) => console.log(e.message));
    useEffect(() => { load(); }, []);

    const list = employees.filter((e) => (e.name + e.position + e.emp_code + (e.username || '')).toLowerCase().includes(search.toLowerCase()));
    const shown = list.slice((page - 1) * 8, page * 8);

    const save = (data) => attempt(async () => {
        const result = await api(editing.id ? `/employees/${editing.id}` : '/employees', editing.id ? 'PUT' : 'POST', data);
        await load();
        if (!editing.id) setQr(result.employee);      // new employee: show the QR code right away
    });
    const remove = () => attempt(async () => { await api(`/employees/${deleting.id}`, 'DELETE'); await load(); });

    return (
        <>
            <div className="bar">
                <h2 style={{ margin: 0 }}>Employees</h2><span className="sp"></span>
                <input style={{ maxWidth: 240 }} placeholder="Search employees" aria-label="Search employees" value={search}
                       onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                <button className="btn" onClick={() => setEditing(BLANK)}>Add employee</button>
            </div>
            <div className="card">
                <div className="tw">
                    <table>
                        <thead><tr><th>ID</th><th>Name</th><th>Position</th><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {shown.map((e) => (
                                <tr key={e.id}>
                                    <td>{e.emp_code}</td><td>{e.name}</td><td>{e.position}</td><td>{e.username || '—'}</td>
                                    <td><span className={'pill ' + (e.role === 'driver' ? 'l' : '')}>{e.role || 'employee'}</span></td>
                                    <td><span className={'pill ' + (e.status === 'Active' ? '' : 'x')}>{e.status}</span></td>
                                    <td>
                                        <button className="btn sm sky" onClick={() => setQr(e)}>QR code</button>{' '}
                                        <button className="btn sm ghost" onClick={() => setEditing(e)}>Edit</button>{' '}
                                        <button className="btn sm red" onClick={() => setDeleting(e)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {!shown.length && <tr><td colSpan="7" className="empty">No employees yet. Select Add employee to start.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pager total={list.length} page={page} size={8} onPage={setPage} />
            </div>
            {editing && <Modal title={editing.id ? 'Edit employee' : 'Add employee'} fields={fieldsFor(editing)} values={editing} onSave={save} onClose={() => setEditing(null)} />}
            {deleting && <Modal title={'Delete ' + deleting.name + '?'} fields={[]} onSave={remove} okLabel="Delete employee" onClose={() => setDeleting(null)} />}
            {qr && <QrModal employee={qr} onClose={() => setQr(null)} />}
        </>
    )
}
export default EmployeePage;
