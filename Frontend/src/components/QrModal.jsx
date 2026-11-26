import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// The QR code holds the employee ID (e.g. GK-001), which is what the attendance scanner reads
const QrModal = ({ employee, onClose }) => {
    const [src, setSrc] = useState('');

    useEffect(() => {
        QRCode.toDataURL(employee.emp_code, { width: 320, margin: 2 }).then(setSrc);
    }, [employee]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const print = () => {
        const w = window.open('', '_blank');
        if (!w) return;
        const box = w.document.createElement('div');
        box.style.cssText = 'text-align:center;font-family:sans-serif;margin-top:40px';
        const name = w.document.createElement('h2'), img = w.document.createElement('img'), code = w.document.createElement('h3');
        name.textContent = employee.name; code.textContent = employee.emp_code; img.src = src;
        box.append(name, img, code);
        w.document.body.append(box);
        img.onload = () => w.print();
    };

    return (
        <div className="mask">
            <div className="card" role="dialog" aria-modal="true" style={{ textAlign: 'center' }}>
                <h3>Attendance QR code</h3>
                <p style={{ margin: '4px 0 0' }}><b>{employee.name}</b></p>
                <p style={{ margin: 0, color: 'var(--mu)' }}>{employee.emp_code}</p>
                {src ? <img src={src} alt={'QR code of ' + employee.emp_code} width="240" height="240" style={{ margin: '10px auto', display: 'block' }} /> : <p className="empty">Making QR code...</p>}
                <p style={{ color: 'var(--mu)', fontSize: 13, margin: 0 }}>Scan this at Attendance to time in and time out.</p>
                <div className="row" style={{ justifyContent: 'center' }}>
                    <button className="btn ghost" onClick={onClose}>Close</button>
                    <button className="btn" onClick={print} disabled={!src}>Print</button>
                    {src && <a className="btn sky" href={src} download={employee.emp_code + '.png'} style={{ textDecoration: 'none' }}>Download</a>}
                </div>
            </div>
        </div>
    )
}
export default QrModal;
