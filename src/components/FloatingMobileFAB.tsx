import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  X, 
  Layers, 
  Users, 
  AlertCircle, 
  FileText, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  Check, 
  Send,
  Eye,
  ShieldAlert,
  Clock,
  Camera,
  CameraOff,
  Scan,
  QrCode,
  RefreshCw,
  Upload,
  Sparkles,
  Info,
  FileCode,
  Mic,
  MicOff
} from 'lucide-react';
import { useEnterprise } from '../core/context/EnterpriseContext';
import confetti from 'canvas-confetti';

interface FloatingMobileFABProps {
  onNavigate: (tab: any) => void;
}

interface EmergencyReport {
  id: string;
  reporterName: string;
  reporterPhone: string;
  governorate: string;
  district: string;
  emergencyType: string;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  timestamp: string;
}

interface ScanAsset {
  id: string;
  type: 'beneficiary' | 'project';
  labelAr: string;
  labelEn: string;
  summaryAr: string;
  summaryEn: string;
  data: any;
}

export default function FloatingMobileFAB({ onNavigate }: FloatingMobileFABProps) {
  const { lang, theme } = useEnterprise();
  const isRtl = lang === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [isTouchOrMobile, setIsTouchOrMobile] = useState(false);
  
  // Emergency Report Modal State
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [viewPastReports, setViewPastReports] = useState(false);
  
  // Quick Scan Modal State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [activeScanTab, setActiveScanTab] = useState<'camera' | 'simulation'>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('');
  const [scannedResult, setScannedResult] = useState<any | null>(null);
  const [scannedType, setScannedType] = useState<'beneficiary' | 'project' | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Emergency Form fields
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [governorate, setGovernorate] = useState('صنعاء');
  const [district, setDistrict] = useState('');
  const [emergencyType, setEmergencyType] = useState('flood');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium'>('high');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const [pastReports, setPastReports] = useState<EmergencyReport[]>([]);

  // Voice Recognition States
  const [showVoiceWidget, setShowVoiceWidget] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
   const [speechSupported, setSpeechSupported] = useState(true);
   const recognitionRef = useRef<any>(null);
 
   // Quick Voice Note States
   const [showVoiceNoteModal, setShowVoiceNoteModal] = useState(false);
   const [voiceNoteTranscript, setVoiceNoteTranscript] = useState('');
   const [voiceNoteTargetType, setVoiceNoteTargetType] = useState<'project' | 'beneficiary'>('project');
   const [voiceNoteTargetId, setVoiceNoteTargetId] = useState('');
   const [voiceNoteStatus, setVoiceNoteStatus] = useState<'idle' | 'recording' | 'saving' | 'success' | 'error'>('idle');
   const [voiceNoteError, setVoiceNoteError] = useState<string | null>(null);
   const [projectsList, setProjectsList] = useState<any[]>([]);
   const [beneficiariesList, setBeneficiariesList] = useState<any[]>([]);
   const [loadingRecords, setLoadingRecords] = useState(false);
   const [isRecordingVoiceNote, setIsRecordingVoiceNote] = useState(false);
   const voiceNoteRecognitionRef = useRef<any>(null);
   
   // Stored active records from localStorage
   const [activeProject, setActiveProject] = useState<any | null>(null);
   const [activeBeneficiary, setActiveBeneficiary] = useState<any | null>(null);
 
   const handleOpenVoiceNoteModal = async () => {
     // Stop other voice actions
     stopListening();
     
     // Read active items from localStorage
     const storedProj = localStorage.getItem('nexora_active_project');
     const storedBen = localStorage.getItem('nexora_active_beneficiary');
     
     let activeP = null;
     let activeB = null;
     
     if (storedProj) {
       try {
         activeP = JSON.parse(storedProj);
         setActiveProject(activeP);
       } catch (e) {
         console.error(e);
       }
     } else {
       setActiveProject(null);
     }
     
     if (storedBen) {
       try {
         activeB = JSON.parse(storedBen);
         setActiveBeneficiary(activeB);
       } catch (e) {
         console.error(e);
       }
     } else {
       setActiveBeneficiary(null);
     }
     
     // Default select based on active page or stored items
     let targetType: 'project' | 'beneficiary' = 'project';
     if (activeP) {
       targetType = 'project';
     } else if (activeB) {
       targetType = 'beneficiary';
     }
     
     setVoiceNoteTargetType(targetType);
     setVoiceNoteTranscript('');
     setVoiceNoteError(null);
     setVoiceNoteStatus('idle');
     setIsRecordingVoiceNote(false);
     
     // Open modal
     setShowVoiceNoteModal(true);
     
     setLoadingRecords(true);
     try {
       const [projRes, benRes] = await Promise.all([
         fetch('/api/tables/projects'),
         fetch('/api/tables/beneficiaries')
       ]);
       
       let pList = [];
       let bList = [];
       
       if (projRes.ok) {
         pList = await projRes.json();
         setProjectsList(pList);
       }
       if (benRes.ok) {
         bList = await benRes.json();
         setBeneficiariesList(bList);
       }
       
       // Select appropriate record
       if (targetType === 'project') {
         if (activeP) {
           setVoiceNoteTargetId(activeP.id);
         } else if (pList.length > 0) {
           setVoiceNoteTargetId(pList[0].id);
         } else {
           setVoiceNoteTargetId('');
         }
       } else {
         if (activeB) {
           setVoiceNoteTargetId(activeB.id);
         } else if (bList.length > 0) {
           setVoiceNoteTargetId(bList[0].id);
         } else {
           setVoiceNoteTargetId('');
         }
       }
     } catch (e) {
       console.error("Error setting up voice note target lists:", e);
     } finally {
       setLoadingRecords(false);
     }
   };
 
   const startVoiceNoteRecording = () => {
     const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
     if (!SpeechRecognition) {
       setVoiceNoteError(isRtl ? 'التعرف على الصوت غير مدعوم في هذا المتصفح' : 'Speech recognition is not supported in this browser.');
       return;
     }
 
     setVoiceNoteError(null);
     setIsRecordingVoiceNote(true);
     setVoiceNoteStatus('recording');
 
     try {
       if (voiceNoteRecognitionRef.current) {
         try {
            voiceNoteRecognitionRef.current.abort();
          } catch (e) { console.error('[FAB] Failed to abort previous speech recognition:', e); }
       }
 
       const rec = new SpeechRecognition();
       rec.continuous = true;
       rec.interimResults = true;
       rec.lang = isRtl ? 'ar-YE' : 'en-US';
 
       let finalTranscript = '';
 
       rec.onresult = (event: any) => {
         let interimTranscript = '';
         for (let i = event.resultIndex; i < event.results.length; ++i) {
           const trans = event.results[i][0].transcript;
           if (event.results[i].isFinal) {
             finalTranscript += trans + ' ';
           } else {
             interimTranscript += trans;
           }
         }
         setVoiceNoteTranscript(finalTranscript + interimTranscript);
       };
 
       rec.onerror = (event: any) => {
         console.error('Voice Note recording error:', event.error);
         if (event.error === 'not-allowed') {
           setVoiceNoteError(isRtl ? 'تم رفض إذن الوصول للميكروفون' : 'Microphone access denied.');
         } else if (event.error !== 'no-speech') {
           setVoiceNoteError(isRtl ? `خطأ: ${event.error}` : `Error: ${event.error}`);
         }
       };
 
       rec.onend = () => {
         setIsRecordingVoiceNote(false);
       };
 
       voiceNoteRecognitionRef.current = rec;
       rec.start();
     } catch (e: any) {
       setVoiceNoteError(e.message || 'Error');
       setIsRecordingVoiceNote(false);
     }
   };
 
   const stopVoiceNoteRecording = () => {
     if (voiceNoteRecognitionRef.current) {
       try {
          voiceNoteRecognitionRef.current.stop();
        } catch (e) { console.error('[FAB] Failed to stop voice note recording:', e); }
     }
     setIsRecordingVoiceNote(false);
     if (voiceNoteStatus === 'recording') {
       setVoiceNoteStatus('idle');
     }
   };
 
   const handleSaveVoiceNote = async () => {
     if (!voiceNoteTargetId) {
       setVoiceNoteError(isRtl ? 'الرجاء اختيار سجل مستهدف أولاً' : 'Please select a target record first.');
       return;
     }
     if (!voiceNoteTranscript.trim()) {
       setVoiceNoteError(isRtl ? 'الملاحظة الصوتية فارغة، يرجى التحدث أو كتابة نص أولاً' : 'The voice note is empty. Please speak or type some text first.');
       return;
     }
 
     setVoiceNoteStatus('saving');
     setVoiceNoteError(null);
 
     try {
       const endpoint = voiceNoteTargetType === 'project' 
         ? `/api/tables/projects/${voiceNoteTargetId}`
         : `/api/tables/beneficiaries/${voiceNoteTargetId}`;
 
       const getRes = await fetch(endpoint);
       if (!getRes.ok) {
         throw new Error(isRtl ? 'فشل جلب تفاصيل السجل الحالي' : 'Failed to fetch current record details.');
       }
       const recordData = await getRes.json();
 
       const dateStr = new Date().toLocaleString(isRtl ? 'ar-YE' : 'en-US', {
         year: 'numeric',
         month: 'numeric',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
       });
       const appendMarker = isRtl 
         ? `

📝 [ملاحظة صوتية ميدانية - ${dateStr}]
🎙️ ${voiceNoteTranscript}`
         : `

📝 [Field Voice Note - ${dateStr}]
🎙️ ${voiceNoteTranscript}`;
 
       let updatePayload: any = {};
       if (voiceNoteTargetType === 'project') {
         const currentDesc = recordData.description || '';
         updatePayload = {
           ...recordData,
           description: currentDesc + appendMarker
         };
       } else {
         const currentNotes = recordData.notes || '';
         updatePayload = {
           ...recordData,
           notes: currentNotes + appendMarker
         };
       }
 
       const putRes = await fetch(endpoint, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify(updatePayload)
       });
 
       if (!putRes.ok) {
         const errData = await putRes.json();
         throw new Error(errData.error || (isRtl ? 'فشل حفظ التحديث' : 'Failed to save update.'));
       }
 
       setVoiceNoteStatus('success');
       
       try {
         confetti({
           particleCount: 80,
           spread: 60,
            origin: { y: 0.8 }
          });
        } catch (e) { console.error('[FAB] Failed to trigger confetti:', e); }
 
       window.dispatchEvent(new CustomEvent('nexora-refresh-data'));
 
       setTimeout(() => {
         setShowVoiceNoteModal(false);
       }, 1500);
 
     } catch (err: any) {
       console.error("Error saving voice note:", err);
       setVoiceNoteStatus('error');
       setVoiceNoteError(err.message || (isRtl ? 'خطأ غير متوقع أثناء الحفظ' : 'An unexpected error occurred during save.'));
     }
   };

  // Predefined simulator samples (used ONLY by the Smart Simulator tab / offline)
  const simulatorSamples: ScanAsset[] = [
    {
      id: 'asset-id-yem',
      type: 'beneficiary',
      labelAr: '🪪 بطاقة شخصية يمنية آليّة',
      labelEn: '🪪 Yemeni National ID Card',
      summaryAr: 'بيانات الهوية الوطنية الموحدة للمواطن محمد أحمد الحريبي',
      summaryEn: 'Unified National ID details for citizen Mohammed Ahmed Al-Huraibi',
      data: {
        fullNameAr: 'محمد أحمد قاسم الحريبي',
        beneficiaryCode: 'BEN-ID-701982',
        phonePrimary: '773829402',
        age: '34',
        governorate: 'تعز',
        district: 'الشمايتين',
        categoryCode: 'DISABLED',
        genderCode: 'MALE',
        financialStatus: 'poor',
        notes: 'تم التحقق من رقم الهوية آليا عبر ماسح الباركود للبطاقة الشخصية الذكية.'
      }
    },
    {
      id: 'asset-vch-ocha',
      type: 'beneficiary',
      labelAr: '🎟️ كرت مساعدات/قسيمة الغذاء للنازحين',
      labelEn: '🎟️ UNHCR Relief Aid Voucher',
      summaryAr: 'قسيمة المستفيد الإغاثية رقم 99201 باسم فاطمة بنت علي المأربي',
      summaryEn: 'Relief voucher #99201 for beneficiary Fatima Ali Al-Maribi',
      data: {
        fullNameAr: 'فاطمة بنت علي صالح المأربي',
        beneficiaryCode: 'BEN-VOU-99201',
        phonePrimary: '711394821',
        age: '42',
        governorate: 'مأرب',
        district: 'الوادى',
        categoryCode: 'WIDOW',
        genderCode: 'FEMALE',
        financialStatus: 'poorest',
        notes: 'قسيمة توزيع سلال غذائية طارئة - منسقة مع الأوتشا لشهر أغسطس ٢٠٢٦.'
      }
    },
    {
      id: 'asset-prj-ocha',
      type: 'project',
      labelAr: '📄 مستند ميثاق مشروع الاستجابة الطارئة (WASH)',
      labelEn: '📄 OCHA Emergency Project Charter (WASH)',
      summaryAr: 'مستند ميثاق مشروع المياه والصرف الصحي العاجل بمأرب',
      summaryEn: 'Urgent water and sanitation field project brief (Marib)',
      data: {
        code: 'PROJ-WASH-2026',
        nameAr: 'مشروع المياه والصرف الصحي الطارئ بمخيمات نازحي مأرب',
        nameEn: 'Emergency WASH & Sanitation Campaign for Marib IDPs',
        budget: '125000000',
        locationName: 'مأرب - مخيم الجفينة',
        description: 'توريد شبكة ضخ مياه، وخزانات إغاثية متكاملة لعدد ٥٠٠ أسرة متضررة بشكل فوري.'
      }
    },
    {
      id: 'asset-prj-clinic',
      type: 'project',
      labelAr: '📋 باركود كراسة الشروط لتوريد عيادات متنقلة',
      labelEn: '📋 Mobile Medical Clinics Procurement Barcode',
      summaryAr: 'مواصفات توريد العيادات الطبية الإغاثية بالساحل الغربي',
      summaryEn: 'Western Coast mobile clinics procurement specs barcode',
      data: {
        code: 'PROJ-MED-WEST',
        nameAr: 'مشروع تسيير العيادات الطبية المتنقلة بالساحل الغربي',
        nameEn: 'Western Coast Mobile Medical Clinics Deployment',
        budget: '95000000',
        locationName: 'الحديدة - الخوخة',
        description: 'توريد عدد 4 عيادات طبية مجهزة بالكامل بالأدوية والمستلزمات الطارئة لمكافحة الأوبئة.'
      }
    }
  ];

  // Detect touch or mobile viewport
  useEffect(() => {
    const checkTouchAndMobile = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileViewport = window.innerWidth < 1024;
      setIsTouchOrMobile(hasTouch || isMobileViewport);
    };
    checkTouchAndMobile();
    window.addEventListener('resize', checkTouchAndMobile);
    return () => window.removeEventListener('resize', checkTouchAndMobile);
  }, []);

  // LIVE DATABASE scan assets — real beneficiaries & projects take priority over simulator samples
  const [realScanAssets, setRealScanAssets] = useState<ScanAsset[]>([]);

  useEffect(() => {
    if (!showScannerModal) return;
    let cancelled = false;

    const token = localStorage.getItem('rbd_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    Promise.all([
      fetch('/api/tables/beneficiaries?limit=50', { headers }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
      fetch('/api/tables/projects?limit=50', { headers }).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] }))
    ]).then(([benRes, prjRes]) => {
      if (cancelled) return;
      const bens: ScanAsset[] = (benRes.data || []).map((b: any) => ({
        id: `db-ben-${b.id}`,
        type: 'beneficiary' as const,
        labelAr: `🪪 ${b.full_name_ar || b.fullNameAr || 'مستفيد مسجل'}`,
        labelEn: `🪪 ${b.full_name_en || b.fullNameEn || b.full_name_ar || 'Registered Beneficiary'}`,
        summaryAr: `سجل مستفيد حقيقي من قاعدة البيانات — ${b.beneficiary_code || b.governorate || ''}`,
        summaryEn: `Live DB beneficiary record — ${b.beneficiary_code || b.governorate || ''}`,
        data: {
          fullNameAr: b.full_name_ar || '',
          beneficiaryCode: b.beneficiary_code || '',
          phonePrimary: b.phone_primary || b.phone || '',
          age: b.birth_date ? String(new Date().getFullYear() - new Date(b.birth_date).getFullYear()) : (b.age || ''),
          governorate: b.governorate || '',
          district: b.district || '',
          categoryCode: b.vulnerability_status || 'GENERAL',
          genderCode: (b.gender || '').toUpperCase(),
          financialStatus: b.financial_status || 'poor',
          notes: isRtl
            ? 'تم جلب هذا السجل مباشرة من قاعدة بيانات المستفيدين الموحدة.'
            : 'Fetched live from the unified beneficiary database.'
        }
      }));
      const prjs: ScanAsset[] = (prjRes.data || []).map((p: any) => ({
        id: `db-prj-${p.id}`,
        type: 'project' as const,
        labelAr: `📄 ${p.name_ar || p.nameAr || p.project_code || 'مشروع'}`,
        labelEn: `📄 ${p.name_en || p.nameAr || p.project_code || 'Project'}`,
        summaryAr: `مشروع حقيقي من قاعدة البيانات — ${p.project_code || ''}`,
        summaryEn: `Live DB project record — ${p.project_code || ''}`,
        data: {
          code: p.project_code || '',
          nameAr: p.name_ar || '',
          nameEn: p.name_en || '',
          budget: String(p.budget || '0'),
          locationName: p.location_name || p.district || '',
          description: p.description || ''
        }
      }));
      setRealScanAssets([...bens, ...prjs]);
    });

    return () => { cancelled = true; };
  }, [showScannerModal, isRtl]);

  // Priority list: real database records first, curated simulator samples after
  const scanAssets = realScanAssets.length > 0
    ? [...realScanAssets, ...simulatorSamples]
    : simulatorSamples;

  // Check Speech Recognition support on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  // Load past reports from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexora_emergency_reports');
      if (stored) {
        setPastReports(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load emergency reports from localStorage', e);
    }
  }, [showEmergencyModal]);

  // Camera stream controller
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    if (showScannerModal && activeScanTab === 'camera') {
      setCameraError(null);
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } 
      })
      .then((stream) => {
        activeStream = stream;
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn('Camera stream blocked or unavailable:', err);
        setCameraError(
          isRtl 
            ? 'تعذر الوصول المباشر للكاميرا. قد يكون ذلك بسبب صلاحيات الأمان في المتصفح. الرجاء استخدام تبويب "محاكي المسح الذكي" المباشر.'
            : 'Direct camera access is blocked due to browser security settings. Please use the "Smart Simulator" tab.'
        );
        // Fall back automatically to simulation tab so the user is never stuck
        setActiveScanTab('simulation');
      });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showScannerModal, activeScanTab]);

  if (!isTouchOrMobile) return null;

  const handleAction = (type: 'project' | 'beneficiary' | 'emergency' | 'scan') => {
    setIsOpen(false);
    if (type === 'project') {
      onNavigate('projects');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('nexora-trigger-create-project'));
      }, 150);
    } else if (type === 'beneficiary') {
      onNavigate('beneficiaries');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('nexora-trigger-create-beneficiary'));
      }, 150);
    } else if (type === 'emergency') {
      setShowEmergencyModal(true);
    } else if (type === 'scan') {
      setScannedResult(null);
      setScannedType(null);
      setShowScannerModal(true);
      setActiveScanTab('camera');
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(isRtl ? 'ميزة التعرف على الصوت غير مدعومة في هذا المتصفح.' : 'Speech recognition is not supported in this browser.');
      return;
    }

    setVoiceError(null);
    setTranscript('');
    setIsListening(true);

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn('Abort error ignored:', e);
        }
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = isRtl ? 'ar-YE' : 'en-US';

      rec.onstart = () => {
        // Speech recognition started
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        
        parseVoiceCommand(text);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError(isRtl ? 'تم رفض إذن الوصول للميكروفون. يرجى تفعيل الصلاحية.' : 'Microphone access denied. Please enable permission.');
        } else if (event.error === 'no-speech') {
          setVoiceError(isRtl ? 'لم يتم رصد أي صوت. يرجى المحاولة مرة أخرى.' : 'No speech detected. Please try again.');
        } else {
          setVoiceError(isRtl ? `خطأ في التعرف على الصوت: ${event.error}` : `Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e: any) {
      console.error('Failed to start speech recognition', e);
      setVoiceError(e.message || 'Error starting recognition');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.error(e);
      }
    }
    setIsListening(false);
  };

  const parseVoiceCommand = (text: string) => {
    const textClean = text.toLowerCase().trim();
    
    // English keywords
    const isProjectEn = textClean.includes('project') || textClean.includes('create project') || textClean.includes('new project') || textClean.includes('add project');
    const isBeneficiaryEn = textClean.includes('beneficiary') || textClean.includes('add beneficiary') || textClean.includes('create beneficiary') || textClean.includes('new beneficiary') || textClean.includes('register beneficiary');

    // Arabic keywords (supports various forms with or without Alef hamza)
    const isProjectAr = textClean.includes('مشروع') || textClean.includes('انشاء مشروع') || textClean.includes('إنشاء مشروع') || textClean.includes('مشروع جديد') || textClean.includes('اضافه مشروع') || textClean.includes('إضافة مشروع');
    const isBeneficiaryAr = textClean.includes('مستفيد') || textClean.includes('اضافه مستفيد') || textClean.includes('إضافة مستفيد') || textClean.includes('مستفيد جديد') || textClean.includes('تسجيل مستفيد') || textClean.includes('تسجيل المستفيد');

    if (isProjectEn || isProjectAr) {
      handleAction('project');
      setShowVoiceWidget(false);
      confetti({
        particleCount: 50,
        spread: 30,
        origin: { y: 0.8 }
      });
    } else if (isBeneficiaryEn || isBeneficiaryAr) {
      handleAction('beneficiary');
      setShowVoiceWidget(false);
      confetti({
        particleCount: 50,
        spread: 30,
        origin: { y: 0.8 }
      });
    } else {
      setVoiceError(
        isRtl 
          ? `لم يتم التعرف على الأمر: "${text}". جرب قول "مشروع" أو "مستفيد"` 
          : `Command not recognized: "${text}". Try saying "project" or "beneficiary"`
      );
    }
  };

  // Trigger scanning sequence animation
  const triggerScanSequence = (asset: ScanAsset) => {
    setIsScanning(true);
    setScanProgress(5);
    setScannedResult(null);
    setScanStepText(isRtl ? 'جاري كشف حواف المستند...' : 'Detecting document borders...');
    
    const steps = [
      { p: 30, t: isRtl ? 'تحسين جودة المسح وتصفية الظلال...' : 'Enhancing image quality & contrast filters...' },
      { p: 65, t: isRtl ? 'تشغيل خوارزميات التعرف الضوئي OCR...' : 'Analyzing characters via OCR algorithms...' },
      { p: 90, t: isRtl ? 'مطابقة الحقول واستخراج البنية الرقمية...' : 'Mapping data structures to Enterprise fields...' },
      { p: 100, t: isRtl ? 'اكتمل فك الرموز ومطابقة الكود بنجاح!' : 'Decoding & data alignment complete!' }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setScanProgress(step.p);
        setScanStepText(step.t);
        if (step.p === 100) {
          setTimeout(() => {
            setIsScanning(false);
            setScannedResult(asset.data);
            setScannedType(asset.type);
            confetti({
              particleCount: 50,
              spread: 40,
              origin: { y: 0.8 }
            });
          }, 400);
        }
      }, (idx + 1) * 600);
    });
  };

  // Camera Snapshot Simulator (server-side OCR is not available; resolves against live DB records first)
  const handleCameraCapture = () => {
    // Pick a random asset — real database records take priority over simulator samples
    const randomIndex = Math.floor(Math.random() * scanAssets.length);
    const chosenAsset = scanAssets[randomIndex];
    
    setIsScanning(true);
    setScanProgress(10);
    setScannedResult(null);
    setScanStepText(isRtl ? 'جاري التقاط لقطة عالية الدقة...' : 'Capturing high-res snapshot...');

    setTimeout(() => {
      setScanProgress(45);
      setScanStepText(isRtl ? 'جاري معالجة الإضاءة وتصحيح انحراف المستند...' : 'Adjusting angles and brightness levels...');
    }, 600);

    setTimeout(() => {
      setScanProgress(80);
      setScanStepText(isRtl ? 'استخراج معلومات الهوية الوطنية / كود المشروع...' : 'Parsing National ID card / Project QR code fields...');
    }, 1200);

    setTimeout(() => {
      setScanProgress(100);
      setScanStepText(isRtl ? 'اكتمل التحليل بنجاح!' : 'Document decoded successfully!');
      setTimeout(() => {
        setIsScanning(false);
        setScannedResult(chosenAsset.data);
        setScannedType(chosenAsset.type);
        confetti({
          particleCount: 60,
          spread: 45,
          colors: ['#059669', '#d97706', '#ffffff']
        });
      }, 300);
    }, 1800);
  };

  // File Input Scan
  const handleFileUploadScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Pick first project or beneficiary randomly to simulate upload scan
    const isProject = e.target.files[0].name.toLowerCase().includes('proj') || Math.random() > 0.5;
    const selectedDemoAsset = isProject 
      ? scanAssets.find(a => a.type === 'project') || scanAssets[0]
      : scanAssets.find(a => a.type === 'beneficiary') || scanAssets[scanAssets.length - 1];

    setIsScanning(true);
    setScanProgress(20);
    setScannedResult(null);
    setScanStepText(isRtl ? 'قراءة الملف المرفوع...' : 'Reading uploaded file metadata...');

    setTimeout(() => {
      setScanProgress(60);
      setScanStepText(isRtl ? 'تطبيق مصفوفات التحليل الضوئي...' : 'Parsing document pixels & metadata...');
    }, 800);

    setTimeout(() => {
      setScanProgress(100);
      setScanStepText(isRtl ? 'تم فك تشفير الملف المستورد!' : 'Imported file metadata decoded!');
      setTimeout(() => {
        setIsScanning(false);
        setScannedResult(selectedDemoAsset.data);
        setScannedType(selectedDemoAsset.type);
        confetti({ particleCount: 40 });
      }, 400);
    }, 1500);
  };

  // Apply Scanned Data to Active Workspace Form
  const handleApplyScannedData = () => {
    if (!scannedResult || !scannedType) return;
    
    setShowScannerModal(false);
    
    if (scannedType === 'project') {
      onNavigate('projects');
      setTimeout(() => {
        // Dispatch custom event with prefilled project payload
        window.dispatchEvent(new CustomEvent('nexora-trigger-create-project', {
          detail: scannedResult
        }));
      }, 200);
    } else {
      onNavigate('beneficiaries');
      setTimeout(() => {
        // Dispatch custom event with prefilled beneficiary payload
        window.dispatchEvent(new CustomEvent('nexora-trigger-create-beneficiary', {
          detail: scannedResult
        }));
      }, 200);
    }
  };

  const handleEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!reporterName.trim() || !reporterPhone.trim() || !district.trim() || !description.trim()) {
      setFormError(isRtl ? 'الرجاء ملء كافة الحقول الإجبارية.' : 'Please fill in all required fields.');
      return;
    }

    const newReport: EmergencyReport = {
      id: `EMG-${Date.now().toString().slice(-6)}`,
      reporterName,
      reporterPhone,
      governorate,
      district,
      emergencyType,
      severity,
      description,
      timestamp: new Date().toLocaleString(isRtl ? 'ar-YE' : 'en-US')
    };

    try {
      const updated = [newReport, ...pastReports];
      localStorage.setItem('nexora_emergency_reports', JSON.stringify(updated));
      setPastReports(updated);
      setSubmitSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });

      // Reset form
      setReporterName('');
      setReporterPhone('');
      setDistrict('');
      setDescription('');
      
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowEmergencyModal(false);
      }, 2500);
    } catch (e) {
      setFormError(isRtl ? 'فشل إرسال البلاغ محلياً.' : 'Failed to register the report locally.');
    }
  };

  // Governorate list for Yemen context
  const yemenGovernorates = [
    { ar: 'صنعاء', en: 'Sanaa' },
    { ar: 'عدن', en: 'Aden' },
    { ar: 'تعز', en: 'Taiz' },
    { ar: 'مأرب', en: 'Marib' },
    { ar: 'الحديدة', en: 'Al-Hudaydah' },
    { ar: 'حضرموت', en: 'Hadramout' },
    { ar: 'شبوة', en: 'Shabwah' },
    { ar: 'الجوف', en: 'Al-Jawf' },
    { ar: 'لحج', en: 'Lahj' },
    { ar: 'ذمار', en: 'Abyan' },
    { ar: 'إب', en: 'Ibb' },
    { ar: 'ذمار', en: 'Dhamar' },
    { ar: 'حجة', en: 'Hajjah' },
    { ar: 'صعدة', en: 'Saada' },
  ];

  const emergencyTypes = [
    { code: 'flood', ar: 'السيول والفيضانات 🌧️', en: 'Floods & Rains 🌧️' },
    { code: 'earthquake', ar: 'هزات أرضية/زلازل 🫨', en: 'Earthquakes 🫨' },
    { code: 'epidemic', ar: 'تفشي وباء صحي 🦠', en: 'Epidemic Outbreak 🦠' },
    { code: 'famine', ar: 'انعدام غذاء حرج ⚠️', en: 'Critical Food Insecurity ⚠️' },
    { code: 'water', ar: 'جفاف وانقطاع مياه حاد 🏜️', en: 'Severe Water Scarcity 🏜️' },
    { code: 'fire', ar: 'حرائق غابات ومخيمات 🔥', en: 'Camp/Forest Fires 🔥' },
    { code: 'other', ar: 'أخرى (اكتب في التفاصيل) 📝', en: 'Other (Specify below) 📝' }
  ];

  return (
    <>
      {/* Floating Action Button Wrapper */}
      <div className={`fixed z-40 bottom-24 ${isRtl ? 'left-6' : 'right-6'} flex flex-col items-center`}>
        
        {/* Expanded Mini-Menu Options */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="flex flex-col items-center gap-3 mb-4"
            >
              {/* Option 1: Create Project */}
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                <span className="bg-slate-900/90 text-white dark:bg-zinc-900/90 dark:text-zinc-100 text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg border border-slate-700/50 whitespace-nowrap">
                  {isRtl ? 'إنشاء مشروع جديد' : 'Create New Project'}
                </span>
                <button
                  onClick={() => handleAction('project')}
                  className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl border-2 border-white dark:border-zinc-800 transition-transform active:scale-90"
                >
                  <Layers className="w-5 h-5" />
                </button>
              </div>

              {/* Option 2: Add Beneficiary */}
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                <span className="bg-slate-900/90 text-white dark:bg-zinc-900/90 dark:text-zinc-100 text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg border border-slate-700/50 whitespace-nowrap">
                  {isRtl ? 'تسجيل مستفيد جديد' : 'Add Beneficiary'}
                </span>
                <button
                  onClick={() => handleAction('beneficiary')}
                  className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xl border-2 border-white dark:border-zinc-800 transition-transform active:scale-90"
                >
                  <Users className="w-5 h-5" />
                </button>
              </div>

              {/* Option 3: Quick Scan (NEW!) */}
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                <span className="bg-slate-900/90 text-white dark:bg-zinc-900/90 dark:text-zinc-100 text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg border border-slate-700/50 whitespace-nowrap flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>{isRtl ? 'المسح السريع للوثائق 📷' : 'Quick Document Scan 📷'}</span>
                </span>
                <button
                  onClick={() => handleAction('scan')}
                  className="w-12 h-12 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-xl border-2 border-white dark:border-zinc-800 transition-transform active:scale-90"
                >
                  <Scan className="w-5 h-5" />
                </button>
              </div>

              {/* Option 4: Emergency Report */}
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                <span className="bg-slate-900/90 text-white dark:bg-zinc-900/90 dark:text-zinc-100 text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg border border-slate-700/50 whitespace-nowrap">
                  {isRtl ? 'بلاغ طوارئ عاجل 🚨' : 'Emergency Report 🚨'}
                </span>
                <button
                  onClick={() => handleAction('emergency')}
                  className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl border-2 border-white dark:border-zinc-800 transition-transform active:scale-90"
                >
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </button>
              </div>

              {/* Option 5: Voice Assistant */}
              {speechSupported && (
                <div className={`flex items-center gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="bg-slate-900/90 text-white dark:bg-zinc-900/90 dark:text-zinc-100 text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg border border-slate-700/50 whitespace-nowrap flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>{isRtl ? 'التحكم الصوتي المباشر 🎙️' : 'Live Voice Commands 🎙️'}</span>
                  </span>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowVoiceWidget(true);
                      startListening();
                    }}
                    className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white flex items-center justify-center shadow-xl border-2 border-white dark:border-zinc-800 transition-transform active:scale-90"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Option 6: Quick Voice Note */}
              {speechSupported && (
                <div className={`flex items-center gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                  <span className="bg-slate-900/90 text-white dark:bg-zinc-900/90 dark:text-zinc-100 text-[11px] font-black px-3 py-1.5 rounded-xl shadow-lg border border-slate-700/50 whitespace-nowrap flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <span>{isRtl ? 'ملاحظة صوتية سريعة 📝' : 'Quick Voice Note 📝'}</span>
                  </span>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleOpenVoiceNoteModal();
                    }}
                    className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center justify-center shadow-xl border-2 border-white dark:border-zinc-800 transition-transform active:scale-90"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Trigger FAB */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl text-white font-extrabold focus:outline-none focus:ring-4 focus:ring-emerald-500/30 ${
            isOpen ? 'bg-zinc-800 dark:bg-zinc-700' : 'bg-emerald-600 dark:bg-emerald-600'
          }`}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-7 h-7" />}
        </motion.button>
      </div>

      {/* QUICK DOCUMENT SCANNER MODAL */}
      <AnimatePresence>
        {showScannerModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-zinc-100"
            >
              {/* Header */}
              <div className="h-14 px-6 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black flex items-center gap-2">
                      <span>{isRtl ? 'محطة المسح الضوئي الذكي والبارمترات' : 'Smart Scanning & Parameters Terminal'}</span>
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowScannerModal(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Toggles: Live Camera vs Smart Simulator Fallback */}
              <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveScanTab('camera')}
                  className={`flex-1 py-3 text-xs font-black border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                    activeScanTab === 'camera' 
                      ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'الكاميرا الحية (مسح مباشر)' : 'Live Camera (Scan)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveScanTab('simulation')}
                  className={`flex-1 py-3 text-xs font-black border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                    activeScanTab === 'simulation' 
                      ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'محاكي المسح الذكي 🧠' : 'Smart Simulator 🧠'}</span>
                </button>
              </div>

              {/* Scrollable Scanner Body */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-5">
                
                {/* 1. SCANNING IN PROGRESS STATUS BAR */}
                {isScanning && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col gap-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{scanStepText}</span>
                      </span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{scanProgress}%</span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        className="bg-emerald-600 h-full rounded-full" 
                        initial={{ width: '0%' }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                )}

                {/* 2. CAMERA TAB VIEWPORT */}
                {!isScanning && activeScanTab === 'camera' && (
                  <div className="flex flex-col gap-4">
                    {cameraError ? (
                      // Custom styled warning for iframe blocking / no camera
                      <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex flex-col gap-3">
                        <div className="flex gap-2.5 items-start text-amber-600 dark:text-amber-400">
                          <Info className="w-5 h-5 shrink-0 mt-0.5" />
                          <div className="text-xs font-semibold leading-relaxed">
                            <p className="font-black mb-1">{isRtl ? 'تنبيه صلاحيات أمان الكاميرا' : 'Camera Security Notice'}</p>
                            <p>{cameraError}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveScanTab('simulation')}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-lg transition-all"
                        >
                          {isRtl ? 'الانتقال إلى محاكي المسح الذكي 🚀' : 'Switch to Smart Simulator 🚀'}
                        </button>
                      </div>
                    ) : (
                      // Live Camera Window
                      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-300 dark:border-zinc-800 flex items-center justify-center">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover"
                        />

                        {/* Scanner HUD Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          {/* Corner Borders */}
                          <div className="absolute top-6 left-6 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-md" />
                          <div className="absolute top-6 right-6 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-md" />
                          <div className="absolute bottom-6 left-6 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-md" />
                          <div className="absolute bottom-6 right-6 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-md" />

                          {/* Glowing Laser line animation sliding down */}
                          <motion.div 
                            className="absolute left-4 right-4 h-0.5 bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                            animate={{ top: ['15%', '85%', '15%'] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                          />

                          {/* Center Target Marker */}
                          <div className="w-16 h-16 border border-emerald-500/30 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                          </div>
                        </div>

                        {/* Direct Action Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                          <button
                            type="button"
                            onClick={handleCameraCapture}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform"
                          >
                            <Camera className="w-4 h-4" />
                            <span>{isRtl ? 'التقاط ومسح الوثيقة 📸' : 'Capture & Analyze Document 📸'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick helper note */}
                    <div className="text-[10px] text-slate-400 font-semibold flex items-start gap-1">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
                      <span>{isRtl ? 'وجه كاميرا الهاتف نحو الهوية الشخصية، قسيمة الصرف، أو باركود المشروع ليقوم النظام تلقائياً باستشعار الحواف وقراءتها.' : 'Align phone camera over Yemeni National ID card, distribution voucher, or project barcode to decode metrics automatically.'}</span>
                    </div>
                  </div>
                )}

                {/* 3. SIMULATOR TAB VIEWPORT */}
                {!isScanning && activeScanTab === 'simulation' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isRtl ? 'محاكاة المسح والتعرف الضوئي OCR' : 'Simulated Scan & OCR Engine'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed mb-3">
                        {isRtl 
                          ? (realScanAssets.length > 0
                            ? `اختر أحد السجلات الحقيقية من قاعدة البيانات (${realScanAssets.length} سجل مباشر) أو عينات المحاكي لمسح فوري واستخراج تلقائي للبيانات:`
                            : 'تعذر جلب سجلات حقيقية حالياً — اختر إحدى عينات المحاكي التالية لاستعراض دورة المسح والاستخراج:')
                          : (realScanAssets.length > 0
                            ? `Select a live database record (${realScanAssets.length} synced) or a simulator sample for instant OCR scanning and field extraction:`
                            : 'Live records unavailable right now — pick one of the simulator samples below to preview the scan & extract flow:')}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {scanAssets.map((asset) => (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => triggerScanSequence(asset)}
                            className={`p-3 border text-left rounded-xl transition-all flex flex-col gap-1 text-xs cursor-pointer group ${asset.id.startsWith('db-')
                              ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500'
                              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-emerald-500/5 hover:border-emerald-500'}`}
                          >
                            <span className="font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {isRtl ? asset.labelAr : asset.labelEn}
                            </span>
                            <span className="text-[10px] text-slate-400 group-hover:text-slate-500 dark:group-hover:text-zinc-300 font-semibold line-clamp-1">
                              {isRtl ? asset.summaryAr : asset.summaryEn}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Manual Image Document Upload Scanner option */}
                    <div className="border-2 border-dashed border-slate-300 dark:border-zinc-800 p-4 rounded-xl text-center bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUploadScan}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1.5" />
                      <p className="text-xs font-black text-slate-800 dark:text-zinc-100 mb-0.5">
                        {isRtl ? 'رفع صورة مستند ممسوحة ضوئياً 📂' : 'Upload Scanned Document Image 📂'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {isRtl ? 'يدعم الصور وملفات PDF لفك التشفير واستخراج الحقول' : 'Supports images & PDF files to apply OCR matrix'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. SCANNED RESULTS DISPLAY */}
                {scannedResult && !isScanning && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border-2 border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-2xl flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-emerald-500/20">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="font-black text-slate-900 dark:text-white text-xs">
                          {isRtl ? 'تم التقاط البيانات واستخراجها بنجاح' : 'Data Decoded Successfully'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                        {scannedType === 'project' ? (isRtl ? 'مستند مشروع' : 'Project doc') : (isRtl ? 'بيانات مستفيد' : 'Beneficiary')}
                      </span>
                    </div>

                    {/* Result Card Grid */}
                    <div className="text-xs bg-white dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col gap-2">
                      {scannedType === 'project' ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">{isRtl ? 'رمز المشروع:' : 'Project Code:'}</span>
                            <span className="font-mono font-black text-slate-900 dark:text-white">{scannedResult.code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">{isRtl ? 'اسم المشروع:' : 'Project Name:'}</span>
                            <span className="font-black text-slate-900 dark:text-white">{isRtl ? scannedResult.nameAr : scannedResult.nameEn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">{isRtl ? 'الموازنة المقدرة:' : 'Estimated Budget:'}</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                              {parseInt(scannedResult.budget).toLocaleString(isRtl ? 'ar-YE' : 'en-US')} YER
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">{isRtl ? 'الموقع الجغرافي:' : 'Location:'}</span>
                            <span className="font-bold">{scannedResult.locationName}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-100 dark:border-zinc-900 text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                            <span className="font-black block text-slate-400 text-[10px] mb-0.5">{isRtl ? 'التفاصيل المستخرجة:' : 'Extracted Details:'}</span>
                            {scannedResult.description}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">{isRtl ? 'الاسم الكامل:' : 'Full Name:'}</span>
                            <span className="font-black text-slate-900 dark:text-white">{scannedResult.fullNameAr}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-bold">{isRtl ? 'رمز المستفيد:' : 'Beneficiary Code:'}</span>
                            <span className="font-mono font-black text-slate-900 dark:text-white">{scannedResult.beneficiaryCode}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-zinc-900">
                            <div>
                              <span className="text-slate-400 text-[10px] font-bold block">{isRtl ? 'المحافظة / المديرية:' : 'Gov / District:'}</span>
                              <span className="font-bold">{scannedResult.governorate} - {scannedResult.district}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] font-bold block">{isRtl ? 'رقم الهاتف:' : 'Phone Contact:'}</span>
                              <span className="font-mono font-bold">{scannedResult.phonePrimary}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-zinc-900">
                            <div>
                              <span className="text-slate-400 text-[10px] font-bold block">{isRtl ? 'الفئة العمرية / الجنس:' : 'Age / Gender:'}</span>
                              <span className="font-bold">{scannedResult.age} {isRtl ? 'سنة' : 'yrs'} | {scannedResult.genderCode === 'MALE' ? (isRtl ? 'ذكر' : 'Male') : (isRtl ? 'أنثى' : 'Female')}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 text-[10px] font-bold block">{isRtl ? 'تصنيف الاحتياج:' : 'Category / Status:'}</span>
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                {scannedResult.categoryCode} ({scannedResult.financialStatus})
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Action buttons to apply data */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setScannedResult(null)}
                        className="px-3.5 py-2.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-black text-xs rounded-xl flex items-center justify-center gap-1 flex-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'إعادة المسح' : 'Scan Again'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyScannedData}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 flex-[2] shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {scannedType === 'project' 
                            ? (isRtl ? 'تطبيق وإنشاء مشروع جديد 🚀' : 'Create Prefilled Project 🚀')
                            : (isRtl ? 'تطبيق وإضافة مستفيد جديد 🚀' : 'Create Prefilled Beneficiary 🚀')
                          }
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}

              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-100/50 dark:bg-zinc-900/50 border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowScannerModal(false)}
                  className="px-5 py-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-black rounded-xl transition-colors cursor-pointer"
                >
                  {isRtl ? 'إغلاق المحطة' : 'Close Terminal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emergency Report Modal Overlay */}
      <AnimatePresence>
        {showEmergencyModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-zinc-100"
            >
              {/* Header */}
              <div className="h-14 px-6 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg shrink-0">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black flex items-center gap-2">
                      <span>{isRtl ? 'منصة بلاغات الاستجابة السريعة والطوارئ' : 'Emergency & Rapid Response Alert Panel'}</span>
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => { setShowEmergencyModal(false); setViewPastReports(false); }}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toggle Tabs */}
              <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewPastReports(false)}
                  className={`flex-1 py-3 text-xs font-black border-b-2 transition-colors ${
                    !viewPastReports 
                      ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {isRtl ? '✍️ تسجيل بلاغ ميداني جديد' : '✍️ Write New Emergency Report'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewPastReports(true)}
                  className={`flex-1 py-3 text-xs font-black border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                    viewPastReports 
                      ? 'border-rose-600 text-rose-600 dark:text-rose-400' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isRtl ? `البلاغات السابقة (${pastReports.length})` : `Past Reports (${pastReports.length})`}</span>
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                
                {submitSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                      {isRtl ? 'تم إرسال بلاغ الطوارئ بنجاح!' : 'Emergency Alert Dispatched Successfully!'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
                      {isRtl 
                        ? 'تم تدوين البلاغ محلياً بنجاح وتم تحويله لغرفة العمليات المركزية ومسؤول التقييم الميداني.' 
                        : 'Your report has been stored locally and routed safely to central emergency team dispatch.'}
                    </p>
                  </div>
                ) : viewPastReports ? (
                  // View Past Reports
                  <div className="space-y-4">
                    {pastReports.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 dark:text-zinc-500 text-xs">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>{isRtl ? 'لا توجد بلاغات طوارئ مسجلة حالياً.' : 'No emergency reports recorded yet.'}</p>
                      </div>
                    ) : (
                      pastReports.map((report) => (
                        <div 
                          key={report.id} 
                          className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 text-xs flex flex-col gap-2.5"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="font-mono text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md">
                                {report.id}
                              </span>
                              <h5 className="font-black text-slate-950 dark:text-white mt-1">
                                {yemenGovernorates.find(g => g.ar === report.governorate)?.[isRtl ? 'ar' : 'en']} - {report.district}
                              </h5>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              report.severity === 'critical' 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : report.severity === 'high' 
                                  ? 'bg-amber-600 text-white' 
                                  : 'bg-yellow-500 text-slate-950'
                            }`}>
                              {report.severity === 'critical' ? (isRtl ? 'حرج جداً' : 'Critical') : report.severity === 'high' ? (isRtl ? 'عالي الخطورة' : 'High') : (isRtl ? 'متوسط' : 'Medium')}
                            </span>
                          </div>

                          <div className="text-slate-600 dark:text-zinc-300 font-bold leading-relaxed bg-white dark:bg-zinc-950 p-2 rounded-lg border border-slate-100 dark:border-zinc-800">
                            <span className="text-[10px] font-black text-slate-400 block mb-1">
                              {isRtl ? 'نوع الكارثة: ' : 'Type: '} {emergencyTypes.find(t => t.code === report.emergencyType)?.[isRtl ? 'ar' : 'en']}
                            </span>
                            <p className="text-[11px] font-semibold">{report.description}</p>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-t border-slate-200/50 dark:border-zinc-800/50 pt-2">
                            <span>?? {report.reporterName} ({report.reporterPhone})</span>
                            <span className="text-[9px] font-mono">{report.timestamp}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Write New Report Form
                  <form onSubmit={handleEmergencySubmit} className="space-y-4">
                    {formError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-black flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* Reporter Name & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-500 dark:text-zinc-400 block mb-1">
                          {isRtl ? 'اسم المبلّغ الميداني *' : 'Field Reporter Name *'}
                        </label>
                        <input
                          type="text"
                          value={reporterName}
                          onChange={(e) => setReporterName(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                          placeholder={isRtl ? 'مثال: م. علي صالح' : 'e.g. Ali Saleh'}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-500 dark:text-zinc-400 block mb-1">
                          {isRtl ? 'رقم هاتف التواصل *' : 'Contact Phone *'}
                        </label>
                        <input
                          type="tel"
                          value={reporterPhone}
                          onChange={(e) => setReporterPhone(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                          placeholder="77xxxxxxx"
                        />
                      </div>
                    </div>

                    {/* Governorate & District */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-500 dark:text-zinc-400 block mb-1">
                          {isRtl ? 'المحافظة *' : 'Governorate *'}
                        </label>
                        <select
                          value={governorate}
                          onChange={(e) => setGovernorate(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        >
                          {yemenGovernorates.map((g) => (
                            <option key={g.en} value={g.ar}>
                              {isRtl ? g.ar : g.en}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-500 dark:text-zinc-400 block mb-1">
                          {isRtl ? 'المديرية / المنطقة *' : 'District / Area *'}
                        </label>
                        <input
                          type="text"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                          placeholder={isRtl ? 'مثال: مديرية الشمايتين' : 'e.g. Ash Shamayatayn'}
                        />
                      </div>
                    </div>

                    {/* Emergency Type & Severity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-500 dark:text-zinc-400 block mb-1">
                          {isRtl ? 'نوع الطوارئ الكارثية *' : 'Emergency Disaster Type *'}
                        </label>
                        <select
                          value={emergencyType}
                          onChange={(e) => setEmergencyType(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        >
                          {emergencyTypes.map((t) => (
                            <option key={t.code} value={t.code}>
                              {isRtl ? t.ar : t.en}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-500 dark:text-zinc-400 block mb-1">
                          {isRtl ? 'مستوى الخطورة والحرجية *' : 'Urgency & Severity Level *'}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['medium', 'high', 'critical'] as const).map((sev) => {
                            const labelAr = sev === 'medium' ? 'متوسط' : sev === 'high' ? 'عالي' : 'حرج جداً';
                            const labelEn = sev === 'medium' ? 'Medium' : sev === 'high' ? 'High' : 'Critical';
                            const activeColor = sev === 'critical' ? 'bg-red-500 border-red-500 text-white' : sev === 'high' ? 'bg-amber-600 border-amber-600 text-white' : 'bg-yellow-500 border-yellow-500 text-slate-900';
                            const isActive = severity === sev;
                            return (
                              <button
                                key={sev}
                                type="button"
                                onClick={() => setSeverity(sev)}
                                className={`py-2 px-1 text-[10px] font-black border rounded-xl text-center transition-all cursor-pointer ${
                                  isActive 
                                    ? activeColor 
                                    : 'border-slate-300 dark:border-zinc-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-900'
                                }`}
                              >
                                {isRtl ? labelAr : labelEn}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Situation Description */}
                    <div>
                      <label className="text-xs font-black text-slate-500 dark:text-zinc-400 block mb-1">
                        {isRtl ? 'شرح تفاصيل البلاغ والأثر الميداني العاجل *' : 'Emergency Details & Current Field Impact *'}
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 dark:border-zinc-800 bg-transparent rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 custom-scrollbar resize-none"
                        placeholder={isRtl ? 'مثال: تسببت الأمطار الغزيرة في انهيار جدران 5 منازل وتشريد الأسر في محيط بطن السايلة... بحاجة لمأوى وسلال غذائية بشكل عاجل.' : 'e.g. Heavy rainfall led to water inundating refugee tents... urgent shelter intervention requested.'}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setShowEmergencyModal(false)}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        {isRtl ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'بث بلاغ استجابة طوارئ 📡' : 'Dispatch Emergency Alert 📡'}</span>
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VOICE COMMAND ASSISTANT WIDGET */}
      <AnimatePresence>
        {showVoiceWidget && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900/95 text-white dark:bg-zinc-950/95 border border-slate-700/50 dark:border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col gap-4 text-center"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0 text-left">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    {isListening && (
                      <span className="absolute inline-flex h-4 w-4 rounded-full bg-emerald-500 opacity-75 animate-ping" />
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isListening ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    {isRtl ? 'نظام التحكم الصوتي للعمليات الميدانية' : 'Field Operations Voice Control'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    stopListening();
                    setShowVoiceWidget(false);
                  }}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Central Voice Wave / Status Icon */}
              <div className="flex flex-col items-center justify-center py-4 gap-3">
                <div className="relative w-16 h-16 rounded-full bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
                  {isListening && (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full border-2 border-emerald-500"
                      />
                      <motion.div
                        animate={{ scale: [1, 2.2, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2.2, delay: 0.4, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full border border-emerald-500"
                      />
                    </>
                  )}
                  {isListening ? (
                    <Mic className="w-7 h-7 text-emerald-400 animate-pulse" />
                  ) : (
                    <MicOff className="w-7 h-7 text-slate-500" />
                  )}
                </div>

                <p className="text-xs text-slate-300 font-black leading-relaxed">
                  {isListening ? (
                    isRtl ? 'جاري الاستماع... انطق أمرك الآن:' : 'Listening... Speak your command now:'
                  ) : (
                    isRtl ? 'المساعد الصوتي غير نشط حالياً' : 'Voice Assistant currently paused'
                  )}
                </p>
              </div>

              {/* Transcribed Text Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-center min-h-[56px] flex items-center justify-center">
                {transcript ? (
                  <p className="text-sm font-black text-white italic">
                    "{transcript}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 font-bold italic animate-pulse">
                    {isListening ? (isRtl ? 'تحدث الآن...' : 'Listening...') : (isRtl ? 'اضغط على زر التحدث أدناه للبدء' : 'Tap button below to speak')}
                  </p>
                )}
              </div>

              {/* Supported Commands list */}
              <div className="text-[10px] bg-slate-950/40 border border-slate-800 p-3 rounded-xl flex flex-col gap-2 text-slate-300">
                <p className={`font-black text-emerald-400 mb-0.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {isRtl ? 'الأوامر الصوتية المدعومة:' : 'Supported Commands:'}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                    <span className="font-extrabold text-white">
                      {isRtl ? '• لإنشاء مشروع:' : '? For Project:'}
                    </span>
                    <span className="font-bold text-slate-400 text-[9.5px]">
                      {isRtl ? 'قول "مشروع" أو "إنشاء مشروع"' : 'Say "project" or "create project"'}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                    <span className="font-extrabold text-white">
                      {isRtl ? '• لتسجيل مستفيد:' : '? For Beneficiary:'}
                    </span>
                    <span className="font-bold text-slate-400 text-[9.5px]">
                      {isRtl ? 'قول "مستفيد" أو "تسجيل مستفيد"' : 'Say "beneficiary" or "add beneficiary"'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: Start/Stop listening toggle */}
              <div className="flex gap-2 shrink-0 pt-2">
                {isListening ? (
                  <button
                    type="button"
                    onClick={stopListening}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MicOff className="w-4 h-4" />
                    <span>{isRtl ? 'إيقاف الاستماع ⏸️' : 'Stop Listening ⏸️'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startListening}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mic className="w-4 h-4 animate-bounce" />
                    <span>{isRtl ? 'البدء بالتحدث 🎙️' : 'Start Speaking 🎙️'}</span>
                  </button>
                )}
              </div>

              {/* Voice Error banner */}
              {voiceError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-[10px] text-rose-400 font-semibold leading-relaxed flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                  <span className="flex-1">{voiceError}</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK FIELD VOICE NOTE MODAL */}
      <AnimatePresence>
        {showVoiceNoteModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 font-sans">
                      {isRtl ? 'ملاحظة صوتية ميدانية سريعة' : 'Quick Field Voice Note'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {isRtl ? 'تحديث السجلات والتقارير صوتياً' : 'Update records and reports hands-free'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    stopVoiceNoteRecording();
                    setShowVoiceNoteModal(false);
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex flex-col gap-5">
                {/* Step 1: Target Record Selection */}
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    {isRtl ? '1. السجل المستهدف للتحديث' : '1. Target Record for Update'}
                  </label>
                  
                  {/* Toggle Type */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceNoteTargetType('project');
                        if (activeProject) {
                          setVoiceNoteTargetId(activeProject.id);
                        } else if (projectsList.length > 0) {
                          setVoiceNoteTargetId(projectsList[0].id);
                        } else {
                          setVoiceNoteTargetId('');
                        }
                      }}
                      className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        voiceNoteTargetType === 'project'
                          ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      {isRtl ? 'المشاريع 📁' : 'Projects 📁'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceNoteTargetType('beneficiary');
                        if (activeBeneficiary) {
                          setVoiceNoteTargetId(activeBeneficiary.id);
                        } else if (beneficiariesList.length > 0) {
                          setVoiceNoteTargetId(beneficiariesList[0].id);
                        } else {
                          setVoiceNoteTargetId('');
                        }
                      }}
                      className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        voiceNoteTargetType === 'beneficiary'
                          ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      {isRtl ? 'المستفيدين 👥' : 'Beneficiaries 👥'}
                    </button>
                  </div>

                  {/* Active/Selected record indicator */}
                  {voiceNoteTargetType === 'project' ? (
                    <div>
                      {activeProject ? (
                        <div className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <div>
                              <p className="font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                                {isRtl ? 'المشروع النشط المحدد حالياً:' : 'Currently selected active project:'}
                              </p>
                              <p className="font-black text-slate-800 dark:text-zinc-200 mt-0.5">
                                {isRtl ? activeProject.name_ar : (activeProject.name_en || activeProject.name_ar)}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-black px-2 py-0.5 rounded-md">ID: {activeProject.id}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <select
                            value={voiceNoteTargetId}
                            onChange={(e) => setVoiceNoteTargetId(e.target.value)}
                            className="w-full text-xs font-bold p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 dark:text-zinc-100"
                          >
                            <option value="">{isRtl ? '-- اختر مشروعاً --' : '-- Choose a Project --'}</option>
                            {projectsList.map(proj => (
                              <option key={proj.id} value={proj.id}>
                                {isRtl ? proj.name_ar : (proj.name_en || proj.name_ar)} (ID: {proj.id})
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 px-1">
                            {isRtl ? '💡 نصيحة: حدد أو افتح مشروعاً في لوحة التحكم ليتم اختياره تلقائياً هنا.' : '💡 Tip: Open a project in the workspace to select it automatically.'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {activeBeneficiary ? (
                        <div className="flex items-center justify-between p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <div>
                              <p className="font-bold text-[10px] text-amber-600 dark:text-amber-400">
                                {isRtl ? 'المستفيد النشط المحدد حالياً:' : 'Currently selected active beneficiary:'}
                              </p>
                              <p className="font-black text-slate-800 dark:text-zinc-200 mt-0.5">
                                {activeBeneficiary.name_ar || activeBeneficiary.full_name_ar}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded-md">ID: {activeBeneficiary.id}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <select
                            value={voiceNoteTargetId}
                            onChange={(e) => setVoiceNoteTargetId(e.target.value)}
                            className="w-full text-xs font-bold p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 dark:text-zinc-100"
                          >
                            <option value="">{isRtl ? '-- اختر مستفيداً --' : '-- Choose a Beneficiary --'}</option>
                            {beneficiariesList.map(ben => (
                              <option key={ben.id} value={ben.id}>
                                {ben.full_name_ar || ben.name_ar} (ID: {ben.id})
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 px-1">
                            {isRtl ? '💡 نصيحة: حدد أو افتح تفاصيل مستفيد ليتم اختياره تلقائياً هنا.' : '💡 Tip: View a beneficiary detailed card to select them automatically.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2: Voice Note Recording Controls */}
                <div className="border border-slate-100 dark:border-zinc-900 rounded-xl p-4 bg-slate-50/50 dark:bg-zinc-900/10 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="relative">
                    {isRecordingVoiceNote && (
                      <span className="absolute inset-0 rounded-full bg-amber-500/30 animate-ping" />
                    )}
                    <button
                      type="button"
                      onClick={isRecordingVoiceNote ? stopVoiceNoteRecording : startVoiceNoteRecording}
                      className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md border-2 transition-all active:scale-95 cursor-pointer ${
                        isRecordingVoiceNote
                          ? 'bg-rose-500 border-white text-white dark:border-zinc-800'
                          : 'bg-amber-500 hover:bg-amber-600 border-white text-white dark:border-zinc-800'
                      }`}
                    >
                      {isRecordingVoiceNote ? (
                        <MicOff className="w-7 h-7" />
                      ) : (
                        <Mic className="w-7 h-7" />
                      )}
                    </button>
                  </div>

                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-zinc-200">
                      {isRecordingVoiceNote 
                        ? (isRtl ? 'جاري الاستماع... اضغط للإيقاف المؤقت' : 'Listening... Tap to Pause')
                        : (isRtl ? 'اضغط للبدء بالتسجيل الصوتي المباشر' : 'Tap to Start Live Recording')
                      }
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                      {isRtl ? 'سيقوم النظام بتحويل كلامك لنص مكتوب باللغة المحددة آلياً' : 'Speech-to-text operates in your active browser language'}
                    </p>
                  </div>

                  {/* Real-time Voice Waves simulation */}
                  {isRecordingVoiceNote && (
                    <div className="flex gap-1 items-center justify-center h-4 mt-1">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 5, 2, 4].map((h, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, h * 3, 4] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.05
                          }}
                          className="w-0.5 bg-amber-500 rounded-full"
                          style={{ height: '4px' }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 3: Transcript Preview & Edit */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      {isRtl ? '2. معاينة النص المكتوب وتعديله' : '2. Preview & Edit Transcript'}
                    </label>
                    {voiceNoteTranscript && (
                      <button
                        type="button"
                        onClick={() => setVoiceNoteTranscript('')}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {isRtl ? 'مسح النص 🧹' : 'Clear Text 🧹'}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={voiceNoteTranscript}
                    onChange={(e) => setVoiceNoteTranscript(e.target.value)}
                    placeholder={isRtl ? 'تحدث للبدء بالتدوين المباشر أو اكتب ملاحظتك هنا يدوياً...' : 'Speak to dictate notes or type details manually...'}
                    className="w-full h-28 text-xs font-bold p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:border-amber-500 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 dark:text-zinc-100 leading-relaxed resize-none"
                  />
                </div>

                {/* Error Banner */}
                {voiceNoteError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-semibold leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{voiceNoteError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    stopVoiceNoteRecording();
                    setShowVoiceNoteModal(false);
                  }}
                  className="px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  {isRtl ? 'إلغاء ❌' : 'Cancel ?'}
                </button>

                <button
                  type="button"
                  disabled={voiceNoteStatus === 'saving' || voiceNoteStatus === 'success' || !voiceNoteTranscript.trim() || !voiceNoteTargetId}
                  onClick={handleSaveVoiceNote}
                  className={`flex-1 py-2 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                    voiceNoteStatus === 'saving'
                      ? 'bg-amber-500/50 text-white cursor-not-allowed'
                      : voiceNoteStatus === 'success'
                      ? 'bg-emerald-600 text-white'
                      : !voiceNoteTranscript.trim() || !voiceNoteTargetId
                      ? 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed shadow-none'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {voiceNoteStatus === 'saving' ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{isRtl ? 'جاري الحفظ والتدوين...' : 'Saving to record...'}</span>
                    </>
                  ) : voiceNoteStatus === 'success' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isRtl ? 'تم التدوين والحفظ بنجاح! 🎉' : 'Saved Successfully! 🎉'}</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>{isRtl ? 'حفظ الملاحظة بالسجل 💾' : 'Save Note to Record 💾'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
