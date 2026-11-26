import { useEffect, useState } from 'react';
import PasswordInput from './PasswordInput.jsx';

// fields = [[key, label, type, options]]; onSave returns an error text to keep the modal open
const Modal = ({ title, fields, values = {}, onSave, okLabel = 'Save changes', onClose }) => {
    const [form, setForm] = useState(() => Object.fromEntries(fields.map(([k]) => [k, values[k] ?? ''])));
    const [error, setError] = useState('');

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const save = async () => {
        const data = {};
        fields.forEach(([k]) => { data[k] = String(form[k]).trim(); });
        const result = await onSave(data);
        if (result) setError(result); else onClose();
    };

    const change = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    return (
        <div className="mask">
            <div className="card" role="dialog" aria-modal="true">
                <h3>{title}</h3>
                {fields.map(([k, label, type, options], i) => (
                    <div key={k}>
                        <label htmlFor={'f_' + k}>{label}</label>
                        {type === 'area'
                            ? <textarea id={'f_' + k} rows="7" value={form[k]} onChange={change(k)} />
                            : type === 'sel'
                            ? <select id={'f_' + k} value={form[k]} onChange={change(k)}>
                                {options.map((o) => <option key={o}>{o}</option>)}
                              </select>
                            : type === 'password'
                            ? <PasswordInput id={'f_' + k} value={form[k]} onChange={change(k)} autoFocus={i === 0} />
                            : <input id={'f_' + k} type={type || 'text'}
                                min={type === 'number' ? '0' : undefined}
                                step={type === 'number' ? 'any' : undefined}
                                value={form[k]} onChange={change(k)} autoFocus={i === 0} />
                        }
                    </div>
                ))}
                <p className="err" role="alert">{error}</p>
                <div className="row">
                    <button className="btn ghost" onClick={onClose}>Cancel</button>
                    {onSave && <button className="btn" onClick={save}>{okLabel}</button>}
                </div>
            </div>
        </div>
    )
}
export default Modal;
