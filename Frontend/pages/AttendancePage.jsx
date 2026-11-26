import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { api } from '../api';
import Pager from '../components/Pager';

const AttendancePage = () => {
    const [tab, setTab]           = useState('scan');
    const [records, setRecords]   = useState([]);
    const [page, setPage]         = useState(1);
    const [code, setCode]         = useState('');
    const [result, setResult]     = useState(null);
    const [status, setStatus]     = useState('Scanner off');
    const [camOn, setCamOn]       = useState(false);

    // Correction modal state
    const [correcting, setCorrecting] = useState(null) // attendance record being edited
    const [corrForm, setCorrForm]     = useState({ time_in: '', time_out: '' })
    const [corrErr, setCorrErr]       = useState('')

    const videoRef   = useRef(null);
    const canvasRef  = useRef(null);
    const streamRef  = useRef(null);
    const rafRef     = useRef(null);
    const scanningRef = useRef(false);

    const loadRecords = () => api('/attendance').then(setRecords).catch((e) => console.log(e.message));

    useEffect(() => {
        loadRecords();
        return () => stopCam();
    }, []);

    function stopCam() {
        scanningRef.current = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCamOn(false);
        setStatus('Scanner off');
    }

    async function startCam() {
        setResult(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            const video = videoRef.current;
            video.srcObject = stream;
            await video.play();
            setCamOn(true);
            setStatus('Scanner on — point at a QR code');
            scanningRef.current = true;
            scanFrame();
        } catch (e) {
            setResult({ error: 'Camera unavailable: ' + e.message + '. Type the ID manually instead.' });
        }
    }

    function scanFrame() {
        if (!scanningRef.current) return;
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            rafRef.current = requestAnimationFrame(scanFrame);
            return;
        }
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
        if (qr && qr.data) {
            const scanned = qr.data.trim().toUpperCase()
            if (!scanned.startsWith('GK-')) {
                rafRef.current = requestAnimationFrame(scanFrame);
                return;
            }
            scanningRef.current = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setCamOn(false);
            setCode(scanned);
            setStatus('✅ QR code scanned! Press Time In or Time Out.');
            return;
        }
        rafRef.current = requestAnimationFrame(scanFrame);
    }

    const punch = async (type) => {
        if (!code.trim()) return setResult({ error: 'Scan or enter an employee ID first.' });
        try {
            setResult(await api('/attendance/punch', 'POST', { code: code.trim(), type }));
            setCode('');
            loadRecords();
        } catch (e) { setResult({ error: e.message }); }
    };

    // Open correction modal
    function openCorrect(record) {
        setCorrecting(record)
        setCorrForm({
            time_in:  record.time_in  ? record.time_in.slice(0, 5)  : '',
            time_out: record.time_out ? record.time_out.slice(0, 5) : '',
        })
        setCorrErr('')
    }

    // Save correction
    async function saveCorrection(e) {
        e.preventDefault()
        setCorrErr('')
        try {
            await api(`/attendance/${correcting.id}`, 'PUT', corrForm)
            setCorrecting(null)
            loadRecords()
        } catch (err) { setCorrErr(err.message) }
    }

    const changeTab = (name) => { if (name !== 'scan') stopCam(); setTab(name); };

    return (
        <>
            <div className="bar">
                <button className={'btn ' + (tab === 'scan' ? 'sky' : '')} onClick={() => changeTab('scan')}>Scanner</button>
                <button className={'btn ' + (tab === 'rec'  ? 'sky' : '')} onClick={() => changeTab('rec')}>Records</button>
            </div>

            {tab === 'scan' ? (
                <div className="scan">
                    <div className="card">
                        <p style={{ margin: '0 0 10px' }}>
                            <span className={'dot ' + (camOn ? 'on' : '')} />
                            <b>{status}</b>
                        </p>
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                        <div className="vid">
                            {!camOn && <span>Camera preview</span>}
                            <video ref={videoRef} autoPlay playsInline muted
                                style={{ display: camOn ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="row" style={{ justifyContent: 'flex-start' }}>
                            {!camOn
                                ? <button className="btn sky" onClick={startCam}>Start camera</button>
                                : <button className="btn"     onClick={stopCam}>Stop camera</button>
                            }
                        </div>
                        <label htmlFor="code">Employee ID (scanned or typed)</label>
                        <input id="code" placeholder="GK-001" value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())} autoCapitalize="characters" />
                        <div className="row" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
                            <button className="btn sky" onClick={() => punch('in')}>Time in</button>
                            <button className="btn"     onClick={() => punch('out')}>Time out</button>
                        </div>
                    </div>

                    <div className="card">
                        <b style={{ fontSize: 20, color: 'var(--blue)' }}>Scan result</b>
                        <div className="res" style={{ marginTop: 12 }}>
                            {!result && <span style={{ color: 'var(--mu)' }}>No scan yet. Scan a QR code or type an ID, then choose Time in or Time out.</span>}
                            {result?.error && <b style={{ color: 'var(--bad)' }}>{result.error}</b>}
                            {result && !result.error && (
                                <>
                                    <b>{result.name}</b> ({result.position})<br />
                                    {result.action === 'in'
                                        ? <>Timed in at {result.time} · {result.late ? 'Late' : 'On time'}</>
                                        : <>Timed out at {result.time} · {result.hours?.toFixed(2)} hours</>
                                    }
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="tw">
                        <table>
                            <thead>
                                <tr><th>ID</th><th>Name</th><th>Position</th><th>Date</th><th>Time in</th><th>Time out</th><th>Total hours</th><th>Status</th><th>Correct</th></tr>
                            </thead>
                            <tbody>
                                {records.slice((page - 1) * 8, page * 8).map((a) => (
                                    <tr key={a.id}>
                                        <td>{a.emp_code}</td>
                                        <td>{a.name}</td>
                                        <td>{a.position}</td>
                                        <td>{a.date}</td>
                                        <td>{a.time_in?.slice(0, 5)}</td>
                                        <td>{a.time_out ? a.time_out.slice(0, 5) : '—'}</td>
                                        <td>{a.time_out ? Number(a.total_hours).toFixed(2) : '—'}</td>
                                        <td><span className={'pill ' + (a.is_late ? 'l' : '')}>{a.is_late ? 'Late' : 'On time'}</span></td>
                                        <td>
                                            <button className="btn sm ghost" onClick={() => openCorrect(a)}>Edit</button>
                                        </td>
                                    </tr>
                                ))}
                                {!records.length && <tr><td colSpan="9" className="empty">No attendance yet. Use the scanner to record time in.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <Pager total={records.length} page={page} size={8} onPage={setPage} />
                </div>
            )}

            {/* ── Attendance Correction Modal ── */}
            {correcting && (
                <div className="mask">
                    <div className="card" role="dialog" style={{ maxWidth: 400 }}>
                        <h3>Correct Attendance</h3>
                        <p style={{ fontSize: 13, color: 'var(--mu)', margin: '4px 0 14px' }}>
                            {correcting.name} · {correcting.date}
                        </p>
                        <form onSubmit={saveCorrection}>
                            <label>Time In</label>
                            <input type="time" value={corrForm.time_in}
                                onChange={(e) => setCorrForm({ ...corrForm, time_in: e.target.value })} required />
                            <label>Time Out (leave blank if still on duty)</label>
                            <input type="time" value={corrForm.time_out}
                                onChange={(e) => setCorrForm({ ...corrForm, time_out: e.target.value })} />
                            {corrErr && <p className="err">{corrErr}</p>}
                            <div className="row" style={{ marginTop: 16 }}>
                                <button type="button" className="btn ghost" onClick={() => setCorrecting(null)}>Cancel</button>
                                <button type="submit" className="btn sky">Save correction</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AttendancePage;
