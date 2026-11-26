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