import { useState } from 'react';
import { api, attempt } from '../api';
import Modal from '../components/Modal';

const CARDS = [
    ['Account settings', 'Update your name, username and password.', 'Manage account', 'acct'],
    ['Payroll settings', 'Set how many working days a month the payroll uses.', 'Configure payroll', 'payset'],
    ['Attendance settings', 'Set the start time and required hours per day.', 'Set attendance', 'attset'],
];

const SettingsPage = ({ toast, onAccountChange }) => {
    const [modal, setModal] = useState(null);     // { name, values }

    const open = async (name) => {
        try {
            if (name === 'acct') setModal({ name, values: await api('/settings/account') });
            if (name === 'payset' || name === 'attset') setModal({ name, values: await api('/settings') });
            if (name === 'bk') setModal({ name, values: { d: JSON.stringify(await api('/settings/backup')) } });
        } catch (e) { toast(e.message); }
    };
    const close = () => setModal(null);

    const forms = {
        acct: {
            title: 'Account settings',
            fields: [['name', 'Full name'], ['username', 'Username'], ['password', 'New password (leave blank to keep)', 'password']],
            save: (o) => attempt(async () => { await api('/settings/account', 'PUT', o); onAccountChange(); }),
        },
        payset: {
            title: 'Payroll settings',
            fields: [['workdays', 'Working days per month', 'number'], ['commission_per_gallon', 'Driver commission per gallon (₱)', 'number']],
            save: (o) => attempt(async () => {
                await api('/settings/payroll', 'PUT', o)
                toast('Payroll settings saved')
            }),
        },
        attset: {
            title: 'Attendance settings',
            fields: [['start_time', 'Work start time (late after this)', 'time'], ['hours', 'Required hours per day', 'number']],
            save: (o) => attempt(async () => { await api('/settings/attendance', 'PUT', o); toast('Attendance settings saved'); }),
        },
        bk: {
            title: 'Backup and restore',
            fields: [['d', 'Backup data (copy it, or paste one to restore)', 'area']],
            okLabel: 'Restore data',
            save: (o) => attempt(async () => {
                let data;
                try { data = JSON.parse(o.d); } catch { throw new Error("That isn't a valid backup. Paste the full text."); }
                await api('/settings/restore', 'POST', data);
                toast('Data restored');
            }),
        },
    };
    const form = modal && forms[modal.name];

    return (
        <>
            <h2>Settings</h2>
            <div className="grid2">
                {CARDS.map(([title, text, button, name]) => (
                    <div key={name} className="card set">
                        <h3>{title}</h3><p>{text}</p>
                        <button className="btn" onClick={() => open(name)}>{button}</button>
                    </div>
                ))}
            </div>
            {form && <Modal title={form.title} fields={form.fields} values={modal.values} onSave={form.save} okLabel={form.okLabel} onClose={close} />}
        </>
    )
}
export default SettingsPage;
