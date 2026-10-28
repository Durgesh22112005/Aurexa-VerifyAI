import React, { useMemo, useRef, useState } from 'react'
import {
  Activity, AlertOctagon, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight,
  Bell, BookOpenCheck, Bot, Building2, CalendarClock, Check, CheckCheck, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck, Clock3, Command, Copy,
  Download, ExternalLink, Eye, EyeOff, FileCheck2, FileClock, FileSearch, FileText, Filter,
  Fingerprint, GitCompareArrows, Globe2, Hash, History, Home, Info, Key, Layers3, Link2,
  ListChecks, LockKeyhole, LogOut, Mail, Menu, MessageSquareText, Network, PanelLeftClose,
  Play, Plus, RotateCcw, Search, Send, Settings, Shield, ShieldAlert, ShieldCheck, Sparkles, Upload,
  UserCheck, Users, Workflow, X, Zap
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar
} from 'recharts'

const initialCases = [
  { id:'AUV-2026-1048', institution:'Northbridge Institute of Technology', type:'Extension of Approval', submitted:'28 Oct 2026', owner:'R. Mehta', status:'Needs review', risk:82, docs:8, findings:4, initials:'NI', color:'violet' },
  { id:'AUV-2026-1047', institution:'Greenfield College of Engineering', type:'New Course Addition', submitted:'27 Oct 2026', owner:'S. Iyer', status:'In analysis', risk:54, docs:11, findings:2, initials:'GC', color:'teal' },
  { id:'AUV-2026-1046', institution:'Crescent Technical Academy', type:'Extension of Approval', submitted:'26 Oct 2026', owner:'A. Rao', status:'Clarification sent', risk:38, docs:9, findings:1, initials:'CT', color:'orange' },
  { id:'AUV-2026-1045', institution:'Westlake School of Technology', type:'Intake Increase', submitted:'24 Oct 2026', owner:'M. Shah', status:'Ready for review', risk:21, docs:12, findings:0, initials:'WS', color:'blue' },
  { id:'AUV-2026-1044', institution:'Pioneer Institute of Applied Sciences', type:'New Institution', submitted:'23 Oct 2026', owner:'K. Nair', status:'Needs review', risk:76, docs:7, findings:3, initials:'PI', color:'pink' },
  { id:'AUV-2026-1043', institution:'Riverstone College', type:'Extension of Approval', submitted:'22 Oct 2026', owner:'R. Mehta', status:'Approved by reviewer', risk:12, docs:10, findings:0, initials:'RC', color:'green' },
]
const seedFindings = [
  { id:'F-001', severity:'High', title:'Faculty count mismatch', detail:'Application summary reports 50 faculty; the uploaded faculty register contains 42 listed entries.', evidence:'Application Summary · p. 4 ↔ Faculty Register · p. 2', confidence:96, category:'Cross-document consistency', state:'Open', why:'The two extracted values refer to the same institution and reporting period but differ by 8. This is a discrepancy to reconcile, not proof of misconduct.', next:'Ask the institution to reconcile the faculty count and provide the signed current register.' },
  { id:'F-002', severity:'High', title:'Mandatory evidence not found', detail:'The current fire-safety certificate was not located in the uploaded document set.', evidence:'Required evidence checklist · Fire-safety certificate', confidence:91, category:'Completeness', state:'Open', why:'The configured demo checklist expects this evidence for this application type. Applicability must be confirmed against the correct APH version and institution category.', next:'Request the current certificate or record an authorised exception with a reason.' },
  { id:'F-003', severity:'Medium', title:'Date sequence needs review', detail:'The facility inspection date appears earlier than the document issue date extracted from a related certificate.', evidence:'Inspection Report · p. 1 ↔ Safety Certificate · p. 1', confidence:84, category:'Chronology validation', state:'Open', why:'Extracted dates can be misread by OCR or use different date formats. Check the original documents before concluding the timeline is inconsistent.', next:'Verify the source dates and request clarification if the sequence remains unresolved.' },
  { id:'F-004', severity:'Low', title:'Low-confidence field extraction', detail:'The registration identifier has a low OCR confidence score and may contain a character-level error.', evidence:'Institution Registration · p. 1 · field: registration ID', confidence:62, category:'OCR confidence', state:'Open', why:'Low confidence indicates uncertainty in extraction, not that the source document is invalid. A reviewer should compare the value with the visible source.', next:'Confirm the identifier manually or re-process a higher-resolution scan.' },
]
const rules = [
  { id:'APH-COMP-01', name:'Mandatory evidence checklist', group:'Completeness', version:'APH 2026–27 · demo', enabled:true, description:'Check required evidence by application type and institution category.', severity:'High', source:'Demo rule — replace with verified APH clause' },
  { id:'APH-CONS-02', name:'Cross-document faculty reconciliation', group:'Consistency', version:'APH 2026–27 · demo', enabled:true, description:'Compare faculty totals across application summary, faculty register and department sheets.', severity:'High', source:'Demo rule — configurable threshold' },
  { id:'APH-DATE-03', name:'Chronology and validity check', group:'Chronology', version:'APH 2026–27 · demo', enabled:true, description:'Flag future dates, expired validity periods and conflicting event sequences.', severity:'Medium', source:'Demo rule — date logic only' },
  { id:'APH-ID-04', name:'Institution identity consistency', group:'Identity', version:'APH 2026–27 · demo', enabled:true, description:'Compare institution name, address, registration number and affiliation across documents.', severity:'Medium', source:'Demo rule — no official registry connection' },
  { id:'APH-OCR-05', name:'Low-confidence extraction review', group:'AI quality', version:'Aurexa policy · v1.0', enabled:true, description:'Route fields below the confidence threshold for human correction.', severity:'Medium', source:'Product quality control' },
  { id:'APH-DUP-06', name:'Potential duplicate evidence fingerprint', group:'Authenticity signals', version:'Aurexa policy · v1.0', enabled:false, description:'Compare local file hashes and metadata signals; hash matches are only duplicate indicators.', severity:'Medium', source:'Local demo only — no cross-institution repository' },
]
const activity = [
  { icon:FileSearch, color:'blue', title:'AI review completed', sub:'Northbridge Institute · 4 findings raised', time:'09:42 AM' },
  { icon:Upload, color:'violet', title:'Application package received', sub:'Greenfield College · 11 files in demo workspace', time:'09:18 AM' },
  { icon:MessageSquareText, color:'orange', title:'Clarification draft created', sub:'Crescent Technical Academy · awaiting reviewer action', time:'Yesterday' },
  { icon:ShieldCheck, color:'green', title:'Review decision recorded', sub:'Riverstone College · reviewer-approved in sample data', time:'Yesterday' },
]
const trend = [{d:'Mon',v:18},{d:'Tue',v:25},{d:'Wed',v:22},{d:'Thu',v:34},{d:'Fri',v:29},{d:'Sat',v:41},{d:'Sun',v:38}]
const barData = [{name:'Completeness',flagged:24},{name:'Consistency',flagged:18},{name:'Dates',flagged:12},{name:'OCR quality',flagged:9},{name:'Identity',flagged:7}]
const labScenarios = {
  'cross-doc': [
    {
      id: 'cd-1',
      title: 'Faculty count mismatch',
      case: 'AUV-2026-1048 · Northbridge Institute',
      entity: 'Teaching Faculty Headcount',
      unit: 'Faculty members',
      docA: { name: 'Application Summary Form (p. 4)', value: 50, confidence: 96, context: 'Total approved teaching staff declared for AY 2026–27' },
      docB: { name: 'Uploaded Faculty Register (p. 2)', value: 42, confidence: 94, context: 'Verified faculty entries with active Aadhaar/PAN listings' },
      delta: -8,
      percent: -16.0,
      severity: 'High priority discrepancy',
      tone: 'mismatch',
      rule: 'Headcount must reconcile across all attachments with 0 tolerance.',
      analysis: 'Discrepancy of 8 faculty detected between summary declaration (50) and verified register rows (42). Potential non-compliance with statutory student-to-faculty ratio.',
      recommendation: 'Issue clarification request to reconcile the 8 missing faculty profiles with signed appointment orders.'
    },
    {
      id: 'cd-2',
      title: 'Campus land area variance',
      case: 'AUV-2026-1046 · Crescent Technical Academy',
      entity: 'Contiguous Campus Land Area',
      unit: 'Acres',
      docA: { name: 'Registered Title Deed (p. 1)', value: 12.5, confidence: 92, context: 'Total registered estate parcel in trust name under Survey 42' },
      docB: { name: 'Municipal Revenue NOC (p. 3)', value: 10.2, confidence: 89, context: 'Usable institutional land area recorded by local Revenue Tahsildar' },
      delta: -2.3,
      percent: -18.4,
      severity: 'Medium priority discrepancy',
      tone: 'mismatch',
      rule: 'Institutional land must be contiguous, unencumbered and meet the zonal norm.',
      analysis: 'Revenue authority documents 2.30 acres less than the registered title deed. Land may contain government drainage easement or buffer setback.',
      recommendation: 'Require geo-tagged demarcation survey map and updated encumbrance certificate.'
    },
    {
      id: 'cd-3',
      title: 'Instructional built-up area reconciliation',
      case: 'AUV-2026-1045 · Westlake School of Technology',
      entity: 'Instructional Carpet Area',
      unit: 'sq. meters',
      docA: { name: 'Architect Building Certificate (p. 2)', value: 8500, confidence: 98, context: 'Certified carpet area for classrooms, labs and seminar halls' },
      docB: { name: 'Approved Municipal Building Plan (p. 5)', value: 8500, confidence: 97, context: 'Sanctioned institutional built-up area under municipal seal' },
      delta: 0,
      percent: 0.0,
      severity: 'Passed (100% Match)',
      tone: 'match',
      rule: 'Sanctioned built-up area must match certified architect drawing measurements.',
      analysis: 'Exact 1:1 match across architect certificate and sanctioned municipal plan. Zero variance observed across extracted dimensions.',
      recommendation: 'Mark finding verified. Evidence satisfies APH Chapter II infrastructure norms.'
    }
  ],
  'tamper': [
    {
      id: 't-1',
      title: 'Unique file fingerprint',
      case: 'AUV-2026-1048 · Northbridge Institute',
      fileName: 'Faculty_Register_2026.pdf',
      fileSize: '2.4 MB',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      matchFound: false,
      duplicateCase: null,
      metadataStatus: 'Valid metadata (Adobe Acrobat Pro 2024)',
      producer: 'Quartz PDFContext / macOS 14.4',
      tamperCue: 'None detected (0.04 risk index)',
      tone: 'match',
      conclusion: 'Unique cryptographic fingerprint. No cross-case collision detected in the repository.'
    },
    {
      id: 't-2',
      title: 'Cross-case duplicate certificate collision',
      case: 'AUV-2026-1047 · Greenfield College',
      fileName: 'Fire_Safety_Certificate_2026.pdf',
      fileSize: '1.1 MB',
      hash: '7d5a99f603f231d539ee25644c5085fffc567c96cf50572a9f36f4e62ec66d78',
      matchFound: true,
      duplicateCase: 'AUV-2026-1048 (Northbridge Institute)',
      metadataStatus: 'Exact duplicate hash match detected',
      producer: 'ScanToPDF v3.1',
      tamperCue: 'Identical byte hash uploaded by two unrelated institutions',
      tone: 'mismatch',
      conclusion: 'CRITICAL ALERT: This exact fire safety certificate was also submitted in Case AUV-2026-1048. Automated signal for immediate human verification.'
    },
    {
      id: 't-3',
      title: 'Metadata clock skew anomaly',
      case: 'AUV-2026-1044 · Pioneer Institute',
      fileName: 'Building_Safety_Inspection.pdf',
      fileSize: '3.8 MB',
      hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
      matchFound: false,
      duplicateCase: null,
      metadataStatus: 'Clock Skew / Inconsistent Timestamps',
      producer: 'Photoshop 24.2 / Modified stream',
      tamperCue: 'File modification timestamp precedes creation timestamp by 14 days',
      tone: 'warning',
      conclusion: 'Metadata timestamp inversion indicates document post-processing. Inspect official watermarks, stamp borders and signatures.'
    }
  ],
  'chronology': [
    {
      id: 'chr-1',
      title: 'Inspection vs prerequisite certificate sequence',
      case: 'AUV-2026-1048 · Northbridge Institute',
      events: [
        { name: 'Application Submission', date: '2026-03-01', valid: true, note: 'Online portal filing' },
        { name: 'On-site Inspection Completed', date: '2026-05-15', valid: false, note: 'Report cites Safety Cert issued in June 2026' },
        { name: 'Fire Safety Certificate Issued', date: '2026-06-20', valid: true, note: 'Issued 36 days AFTER the inspection took place' }
      ],
      conflict: true,
      conflictMessage: 'Inspection report completed on 15 May 2026 cites a safety certificate that was not issued until 20 June 2026 (36 days later).',
      severity: 'Sequence anomaly',
      tone: 'mismatch',
      status: 'Sequence anomaly'
    },
    {
      id: 'chr-2',
      title: 'Full statutory compliance timeline',
      case: 'AUV-2026-1045 · Westlake School of Technology',
      events: [
        { name: 'Trust Registration', date: '2018-01-12', valid: true, note: 'State Charity Commissioner' },
        { name: 'Land Title Conveyance', date: '2020-03-04', valid: true, note: 'Registered Sub-Registrar' },
        { name: 'Building Plan Approval', date: '2022-08-18', valid: true, note: 'Town & Country Planning' },
        { name: 'Fire NOC Clearance', date: '2025-11-10', valid: true, note: 'State Fire Service' },
        { name: 'EoA Portal Filing', date: '2026-10-24', valid: true, note: 'AICTE Application' }
      ],
      conflict: false,
      conflictMessage: 'Chronological sequence is valid. All prerequisite approvals were obtained prior to application filing.',
      severity: 'Valid timeline',
      tone: 'match',
      status: 'Clean progression'
    }
  ],
  'copilot': [
    {
      id: 'cop-1',
      title: 'Faculty cadre & student ratio norms',
      query: 'What are the mandatory faculty cadres and ratio for Engineering UG?',
      clauseId: 'APH 2026–27 § 4.2.1',
      category: 'Faculty Norms',
      officialPassage: 'For Undergraduate Engineering and Technology programs, the required Faculty:Student ratio shall be 1:20. The cadre ratio shall ideally be maintained as 1:2:6 (Professor : Associate Professor : Assistant Professor). A minimum of one qualified Professor is required per accredited department.',
      applicability: 'Engineering & Technology UG (B.Tech / B.E.)',
      abstentionRule: 'Will abstain if institution category or department accreditation tier is unspecified.',
      confidence: '96% Grounded Match'
    },
    {
      id: 'cop-2',
      title: 'Mandatory fire-safety clearance clause',
      query: 'Is a fire-safety certificate mandatory for Extension of Approval (EoA)?',
      clauseId: 'APH 2026–27 § 7.1.4',
      category: 'Mandatory Compliance',
      officialPassage: 'Every technical institution seeking Extension of Approval (EoA) or Introduction of New Courses must submit a valid Fire Safety Certificate issued by the competent State/UT Fire Authority having jurisdiction over the institution building.',
      applicability: 'All Technical Institutions · Annual Requirement',
      abstentionRule: 'If temporary exemption is claimed, requires state notification reference.',
      confidence: '98% Grounded Match'
    },
    {
      id: 'cop-3',
      title: 'Permanent corpus fund requirements',
      query: 'What is the required corpus fund for establishing a new private institution?',
      clauseId: 'APH 2026–27 § 1.4.3',
      category: 'Financial Norms',
      officialPassage: 'The applicant Society or Trust shall establish a Joint Fixed Deposit / FDR / Encumbrance-free Corpus Fund of ₹100 Lakhs in the name of the Regional Officer, AICTE and the applicant Trust for a minimum duration of 10 years.',
      applicability: 'New Institution Establishment · Private Un-aided',
      abstentionRule: 'Exempt for Central/State Government institutions.',
      confidence: '94% Grounded Match'
    }
  ],
  'graph': [
    {
      id: 'g-1',
      title: 'Cross-institution trustee & signatory link',
      case: 'AUV-2026-1048 (Northbridge) ↔ AUV-2026-1047 (Greenfield)',
      entityName: 'Dr. Arvind Kulkarni (Trustee PAN: ABCPK1234F)',
      linkType: 'Shared Trustee & Common Signatory',
      overlapDetails: 'Listed as Chairman/Trustee in Northbridge Institute (Case 1048) and as Vice-Chairman in Greenfield College (Case 1047). Same signatory on bank authorization.',
      riskSignal: 'Potential cross-institution governance linkage. Check compliance with trust deed bylaws.',
      matchConfidence: 99,
      tone: 'warning'
    },
    {
      id: 'g-2',
      title: 'Adjacent land survey & identical architect',
      case: 'AUV-2026-1046 (Crescent) ↔ AUV-2026-1044 (Pioneer)',
      entityName: 'V. Raman & Associates (CoA Reg: CA/2012/54821)',
      linkType: 'Contiguous Survey Land & Common Architect',
      overlapDetails: 'Same registered architectural firm provided building carpet area certificates for both campuses. Land plots are contiguous survey partitions 42/1 and 42/2.',
      riskSignal: 'Shared campus facilities or overlapping boundaries require verification on site.',
      matchConfidence: 87,
      tone: 'warning'
    }
  ],
  'routing': [
    {
      id: 'r-1',
      title: 'High-confidence extraction (Express lane)',
      case: 'AUV-2026-1048 (Northbridge)',
      field: 'Permanent Institution ID',
      extractedValue: '1-10948271',
      confidence: 98,
      source: 'Affiliation Order p. 1 (High-res digital document)',
      decision: 'Auto-Assist & One-Click Reviewer Signoff',
      tier: 'green'
    },
    {
      id: 'r-2',
      title: 'Review band extraction (Check source)',
      case: 'AUV-2026-1047 (Greenfield)',
      field: 'Revenue Survey Number',
      extractedValue: 'Plot 48/2A-1',
      confidence: 81,
      source: 'Revenue Patta p. 3 (Handwritten rubber stamp endorsement)',
      decision: 'Reviewer Highlighted Source Verification',
      tier: 'orange'
    },
    {
      id: 'r-3',
      title: 'Low-confidence extraction (Manual correction)',
      case: 'AUV-2026-1048 (Northbridge)',
      field: 'Society Registration Seal Number',
      extractedValue: 'TR-892/04 (?)',
      confidence: 58,
      source: 'Faded Trust Deed seal p. 8 (Low contrast scan)',
      decision: 'Manual Review & Bounding Box Correction Queue',
      tier: 'red'
    }
  ]
}

const navGroups = [
  { label:'WORKSPACE', items:[['Overview',Home],['Applications',Building2],['New verification',Upload],['Investigation',FileSearch],['AI review lab',Sparkles]] },
  { label:'INTELLIGENCE', items:[['Relationship graph',Network],['APH rule studio',BookOpenCheck],['Analytics & reports',Activity]] },
  { label:'GOVERNANCE', items:[['Audit trail',History],['Settings',Settings]] },
]
const pageDescriptions = {
  Overview:['Verification command center','Monitor application throughput, evidence gaps and reviewer workload.'],
  Applications:['Application register','Search, triage and open application cases across the review lifecycle.'],
  'New verification':['Start a verification','Create a case, add a document package and configure the review scope.'],
  Investigation:['Evidence-first investigation','Review explainable findings with source references and human decision controls.'],
  'AI review lab':['Aurexa intelligence lab','Explore assisted extraction, consistency reasoning, duplicate signals and clarification drafting.'],
  'Relationship graph':['Institution relationship explorer','Review potential shared identifiers and document links without treating a match as proof.'],
  'APH rule studio':['Policy and rule studio','Manage versioned, configurable checks; validate official clauses before production use.'],
  'Analytics & reports':['Review performance & reports','Understand the demo review queue and export a transparent case summary.'],
  'Audit trail':['Governance & audit trail','Track reviewer actions, evidence provenance and system events.'],
  Settings:['Workspace settings','Configure review thresholds, data handling and demo integrations.']
}
function Icon({I,size=18,...props}) { return <I size={size} strokeWidth={1.8} {...props}/> }
function Badge({children,tone='gray',dot=false}) { return <span className={`badge ${tone}`}>{dot&&<i/>}{children}</span> }
function Button({children,variant='primary',size='md',...props}) { return <button className={`btn ${variant} ${size}`} {...props}>{children}</button> }
function Panel({children,className=''}) { return <section className={`panel ${className}`}>{children}</section> }
function SectionHead({title,sub,action}) { return <div className="section-head"><div><h3>{title}</h3>{sub&&<p>{sub}</p>}</div>{action}</div> }
function EmptyState({icon: I=FileText,title,sub}) { return <div className="empty"><Icon I={I} size={30}/><b>{title}</b><span>{sub}</span></div> }

const demoOfficials = [
  {
    id: 'dr-sharma',
    name: 'Dr. V. K. Sharma',
    role: 'Chief Regulatory Officer',
    designation: 'Member Secretary & Chief Approver',
    email: 'vk.sharma@aicte.gov.in',
    initials: 'VS',
    color: 'purple',
    clearance: 'Level 4 · Chief Authority',
    department: 'Regulatory Approvals Bureau'
  },
  {
    id: 'officer-mehta',
    name: 'R. Mehta',
    role: 'Senior Verification Officer',
    designation: 'Bureau Head · Scrutiny Division',
    email: 'r.mehta@aicte.gov.in',
    initials: 'RM',
    color: 'teal',
    clearance: 'Level 3 · Senior Reviewer',
    department: 'Technical Institutional Verification'
  },
  {
    id: 'analyst-sen',
    name: 'Ananya Sen',
    role: 'Compliance Forensic Analyst',
    designation: 'AICTE Vigilance & Integrity Cell',
    email: 'a.sen@aicte.gov.in',
    initials: 'AS',
    color: 'orange',
    clearance: 'Level 3 · Forensic Lead',
    department: 'Forensic Document & Integrity Audit'
  }
]

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(demoOfficials[0])
  const [loginEmail, setLoginEmail] = useState(demoOfficials[0].email)
  const [loginPassword, setLoginPassword] = useState('Aurexa@Gov2026')
  const [loginOtp, setLoginOtp] = useState('849201')
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPersonaId, setSelectedPersonaId] = useState('dr-sharma')

  const [page,setPage] = useState('Overview')
  const [collapsed,setCollapsed] = useState(false)
  const [search,setSearch] = useState('')
  const [cases,setCases] = useState(initialCases)
  const [selectedId,setSelectedId] = useState(initialCases[0].id)
  const [statusFilter,setStatusFilter] = useState('All statuses')
  const [riskFilter,setRiskFilter] = useState('All risk levels')
  const [findings,setFindings] = useState(seedFindings)
  const [selectedFinding,setSelectedFinding] = useState(seedFindings[0].id)
  const [notes,setNotes] = useState('')
  const [toast,setToast] = useState('')
  const [rulesState,setRulesState] = useState(rules)
  const [query,setQuery] = useState('What evidence supports the faculty mismatch finding?')
  const [answer,setAnswer] = useState(null)
  const [files,setFiles] = useState([])
  const [caseName,setCaseName] = useState('')
  const [caseType,setCaseType] = useState('Extension of Approval')
  const [institution,setInstitution] = useState('')
  const [caseCreated,setCaseCreated] = useState(false)
  const [reviewDecision,setReviewDecision] = useState('')
  const [filterCategory,setFilterCategory] = useState('All categories')
  const [demoMode,setDemoMode] = useState(true)
  const [threshold,setThreshold] = useState(75)
  const [activeTab,setActiveTab] = useState('Evidence')
  const [graphFocus,setGraphFocus] = useState('Northbridge Institute')
  const [draft,setDraft] = useState('')
  const [labFeature,setLabFeature] = useState('cross-doc')
  const [labSource,setLabSource] = useState('previous')
  const [scenarioIdx,setScenarioIdx] = useState(0)

  // Custom Data states for Add New
  const [customEntity,setCustomEntity] = useState('Faculty Headcount')
  const [customUnit,setCustomUnit] = useState('Faculty members')
  const [customDocA,setCustomDocA] = useState('Self-Appraisal Declaration')
  const [customValA,setCustomValA] = useState(60)
  const [customDocB,setCustomDocB] = useState('Biometric Attendance Register')
  const [customValB,setCustomValB] = useState(52)

  // Tamper / hash custom state
  const [customFileText,setCustomFileText] = useState('Official Extension of Approval Application 2026-27 - Institution Code 1-10948271')
  const [customFileHash,setCustomFileHash] = useState('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  const [customTamperAnomaly,setCustomTamperAnomaly] = useState('None (Clean File)')
  const [customTamperMatch,setCustomTamperMatch] = useState(false)

  // Chronology custom state
  const [customEvents,setCustomEvents] = useState([
    { name: 'Application Submission', date: '2026-03-01' },
    { name: 'On-site Inspection Completed', date: '2026-05-15' },
    { name: 'Fire Safety Certificate Issued', date: '2026-06-20' },
  ])

  // Copilot custom state
  const [customCopilotQuery,setCustomCopilotQuery] = useState('')
  const [customCopilotResult,setCustomCopilotResult] = useState(null)

  // Graph custom state
  const [customInstA,setCustomInstA] = useState('Northbridge Institute')
  const [customInstB,setCustomInstB] = useState('Greenfield College')
  const [customLinkBasis,setCustomLinkBasis] = useState('Shared Trustee & Common Signatory')
  const [customLinkWeight,setCustomLinkWeight] = useState(95)

  // Routing custom state
  const [customFieldName,setCustomFieldName] = useState('Aadhaar / PAN Registration ID')
  const [customConf,setCustomConf] = useState(62)

  const computeHashForText = async (text)=>{
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('')
      setCustomFileHash(hashHex)
    } catch {
      // fallback
    }
  }

  const handleLabUpload = async (e)=>{
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()
      const digest = await crypto.subtle.digest('SHA-256', buffer)
      const hash = Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('')
      setCustomFileHash(hash)
      setCustomFileText(`${file.name} (${formatBytes(file.size)})`)
      notify(`Calculated SHA-256 for ${file.name}`)
    } catch {
      notify('Could not calculate file hash in this browser context.')
    }
  }

  const fileRef = useRef(null)
  const selectedCase = cases.find(c=>c.id===selectedId) || cases[0]
  const currentFinding = findings.find(f=>f.id===selectedFinding) || findings[0]
  const filteredCases = useMemo(()=>cases.filter(c=>(c.institution+' '+c.id+' '+c.type).toLowerCase().includes(search.toLowerCase())&&(statusFilter==='All statuses'||c.status===statusFilter)&&(riskFilter==='All risk levels'||(riskFilter==='High risk'?c.risk>=70:riskFilter==='Medium risk'?c.risk>=40&&c.risk<70:c.risk<40))),[cases,search,statusFilter,riskFilter])
  const filteredFindings = findings.filter(f=>(filterCategory==='All categories'||f.category===filterCategory))
  const notify = (s)=>{setToast(s);window.setTimeout(()=>setToast(''),3200)}
  const go = (p)=>{setPage(p);setToast('')}
  const addFiles = (list)=>{setFiles(prev=>[...prev,...Array.from(list||[]).map(f=>({file:f,name:f.name,size:f.size,type:f.type,hash:null}))]);notify(`${list.length} file(s) selected locally`)}
  const createCase = ()=>{
    if(!institution.trim()||!caseName.trim()){notify('Enter an institution name and case title first.');return}
    const id=`AUV-2026-${1050+cases.length}`
    const c={id,institution:institution.trim(),type:caseType,submitted:'28 Oct 2026',owner:'Current reviewer',status:'In analysis',risk:0,docs:files.length,findings:0,initials:institution.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase(),color:'blue'}
    setCases([c,...cases]);setSelectedId(id);setCaseCreated(true);notify('Demo case created in this browser session.')
  }
  const runDemoAnalysis = ()=>{
    const lower=files.map(x=>x.name.toLowerCase()).join(' ')
    const newItems=[]
    if(!/faculty|staff|teacher/.test(lower)) newItems.push({id:`F-${String(findings.length+1).padStart(3,'0')}`,severity:'Medium',title:'Faculty register not clearly identified',detail:'No filename clearly identifies a faculty register. The document may still be present under another name.',evidence:'Local file list · filename-level signal only',confidence:67,category:'Completeness',state:'Open',why:'This demo checks filenames only; it has not read the contents of your files.',next:'Confirm whether the faculty register is included and map it to the evidence checklist.'})
    if(!/fire|safety|certificate/.test(lower)) newItems.push({id:`F-${String(findings.length+newItems.length+1).padStart(3,'0')}`,severity:'High',title:'Safety certificate not identifiable by filename',detail:'No selected filename clearly identifies a fire or safety certificate.',evidence:'Local file list · filename-level signal only',confidence:73,category:'Completeness',state:'Open',why:'Filename heuristics cannot determine whether a valid certificate exists inside a differently named file.',next:'Locate the certificate or ask the institution to provide it.'})
    if(!newItems.length) newItems.push({id:`F-${String(findings.length+1).padStart(3,'0')}`,severity:'Low',title:'Filename checklist passed',detail:'The selected filenames include likely faculty and certificate evidence. Content and validity remain unverified.',evidence:'Local file list · filename-level signal only',confidence:58,category:'AI quality',state:'Open',why:'A filename match is not content verification or proof of authenticity.',next:'Connect OCR and rule validation services to verify extracted values and document content.'})
    setFindings([...newItems,...findings]);setSelectedFinding(newItems[0].id);setPage('Investigation');notify('Demo triage complete. Findings are filename heuristics, not real AI/OCR results.')
  }
  const runCopilot = ()=>{
    const q=query.toLowerCase()
    let a
    if(q.includes('faculty')||q.includes('mismatch')) a={title:'Evidence-based response',confidence:'High evidence coverage',text:'The demo case contains a faculty-count discrepancy: 50 in the application summary versus 42 in the faculty register. The difference is 8 entries. Verify that both documents refer to the same reporting period and institution before escalating.',evidence:['Application Summary · p. 4 (illustrative reference)','Faculty Register · p. 2 (illustrative reference)'],caution:'The cited page references and values are sample data. No official file was parsed in this demo.'}
    else if(q.includes('aph')||q.includes('rule')||q.includes('compliance')) a={title:'Policy-grounded workflow',confidence:'Requires verified source',text:'Select the applicable Approval Process Handbook edition and institution category, then map each check to an exact clause and effective date. This demo does not contain a verified official APH rule corpus, so it cannot make a definitive compliance determination.',evidence:['APH Rule Studio · demo rules are explicitly marked','Official APH clause and applicability must be verified by an authorised reviewer'],caution:'Do not treat a sample rule as an official AICTE requirement.'}
    else if(q.includes('duplicate')||q.includes('authentic')||q.includes('forg')) a={title:'Authenticity signal guidance',confidence:'Signal only',text:'Start with a cryptographic file hash for exact byte-level duplicates, then add metadata anomalies and visual tamper indicators as separate signals. A hash mismatch does not prove authenticity; a match only means identical bytes. Confirm through an authorised source where available.',evidence:['Local SHA-256 fingerprinting can be implemented in the browser','Official issuer verification requires an authorised integration'],caution:'No official certificate registry is connected in this prototype.'}
    else a={title:'Suggested reviewer workflow',confidence:'Advisory only',text:'Identify the exact field or rule in question, inspect the source document and page, check extraction confidence, compare related evidence, and record a reasoned reviewer outcome. Ask for clarification where evidence remains incomplete.',evidence:['Evidence-first finding record','Reviewer decision and audit note'],caution:'This is a rule-based demo assistant, not a connected large language model.'}
    setAnswer(a)
  }
  const markFinding = (id,state)=>{setFindings(fs=>fs.map(f=>f.id===id?{...f,state}:f));notify(`Finding ${id} marked ${state.toLowerCase()}.`)}
  const exportCSV = ()=>{
    const rows=[['Case ID','Institution','Type','Status','Risk','Documents','Findings'],...cases.map(c=>[c.id,c.institution,c.type,c.status,c.risk,c.docs,c.findings])]
    const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n')
    downloadBlob(csv,'aurexa-application-register.csv','text/csv')
    notify('Application register CSV exported.')
  }
  const exportReport = ()=>{
    const lines=['AUREXA-VERIFYAI — DEMO REVIEW SUMMARY','',`Case: ${selectedCase.id}`,`Institution: ${selectedCase.institution}`,`Application type: ${selectedCase.type}`,`Status: ${selectedCase.status}`,`Demo risk priority: ${selectedCase.risk}/100`,'','FINDINGS',...findings.map(f=>`${f.id} | ${f.severity} | ${f.title} | ${f.state}\nEvidence: ${f.evidence}\nReason: ${f.why}\nNext step: ${f.next}\n`),'','IMPORTANT: Sample data and illustrative findings. Not an official AICTE assessment. Human review required.']
    downloadBlob(lines.join('\n'),'aurexa-demo-review-summary.txt','text/plain')
    notify('Demo report exported.')
  }
  const downloadBlob=(content,name,type)=>{const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
  const hashFile = async (item,index)=>{
    try { const buffer=await item.file.arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',buffer);const hash=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');setFiles(fs=>fs.map((f,i)=>i===index?{...f,hash}:f));notify('SHA-256 calculated locally; no upload performed.') }
    catch { notify('Hash calculation unavailable in this browser context.') }
  }
  const downloadClarification = ()=>{
    const content=`Subject: Clarification required — ${selectedCase.id}\n\nDear Institution Representative,\n\nDuring preliminary review of your ${selectedCase.type} application, the following item(s) require clarification:\n\n${findings.filter(f=>f.state!=='Resolved').map(f=>`• ${f.title}\n  Observation: ${f.detail}\n  Requested action: ${f.next}`).join('\n\n')}\n\nPlease provide the relevant supporting evidence or a written explanation. These observations are preliminary review flags and are not a final determination.\n\nRegards,\nAuthorised Review Team\n`
    downloadBlob(content,'aurexa-clarification-draft.txt','text/plain');notify('Clarification draft downloaded.')
  }

  const handleLoginSubmit = (e)=>{
    if(e) e.preventDefault()
    if(!loginEmail.trim()||!loginPassword.trim()){
      notify('Please enter your Government Email / Officer ID and Passcode.')
      return
    }
    setIsAuthenticated(true)
    notify(`Officer ${currentUser.name} authenticated. Welcome to Regulatory Operations.`)
  }

  const handleLogout = ()=>{
    setIsAuthenticated(false)
    notify('Session safely terminated. Officer logged out.')
  }

  const renderLogin = ()=> <div className="login-page-wrap">
    <div className="login-glow-1"/>
    <div className="login-glow-2"/>
    <div className="login-card-container">
      <div className="login-side-banner">
        <div className="login-side-header">
          <div className="login-brand-mark"><ShieldCheck size={26}/></div>
          <div className="login-brand-copy">
            <b>AUREXA<span>·</span>VERIFYAI</b>
            <small>REGULATORY OPERATIONS PORTAL</small>
          </div>
        </div>

        <div className="login-side-content">
          <div className="login-official-badge"><Shield size={12}/> RESTRICTED GOVERNMENT PORTAL</div>
          <h2>Institutional Approval & Verification Intelligence</h2>
          <p>Secure access for AICTE, State Technical Directorates, and authorized higher regulatory authorities. Deterministic multi-document verification, APH compliance audits, and forensic integrity checking.</p>
          <div className="login-security-features">
            <div className="login-sec-item">
              <div className="login-sec-icon"><BookOpenCheck size={16}/></div>
              <div><b>APH Compliance Grounding</b><span>Enforces official Approval Process Handbook clauses and quotas.</span></div>
            </div>
            <div className="login-sec-item">
              <div className="login-sec-icon"><Fingerprint size={16}/></div>
              <div><b>Cryptographic Provenance</b><span>SHA-256 fingerprinting & immutable institutional tamper tracking.</span></div>
            </div>
            <div className="login-sec-item">
              <div className="login-sec-icon"><UserCheck size={16}/></div>
              <div><b>Human-in-the-Loop Safeguards</b><span>Advisory AI signals with mandatory signoff by authorized officials.</span></div>
            </div>
          </div>
        </div>

        <div className="login-side-footer">
          <span><LockKeyhole size={13}/> 256-Bit TLS · Level 4 Audit</span>
          <span>AICTE Demo Environment · v2.4</span>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-form-header">
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:6}}>
            <Badge tone="purple">Official Access</Badge>
            <span className="tiny-muted">Gov ID Verification</span>
          </div>
          <h3>Higher Official Authentication</h3>
          <p>Select a pre-verified authority persona or enter authorized credentials.</p>
        </div>

        <div className="persona-section">
          <div className="persona-section-title">
            <span>Select Official Role (Demo Persona)</span>
            <span style={{color:'#656ff0',cursor:'pointer'}} onClick={()=>notify('Clearance levels control approval, recommendation, and forensic inspection privileges.')}>Clearance Info</span>
          </div>
          <div className="persona-grid">
            {demoOfficials.map(official=>{
              const isActive = selectedPersonaId === official.id
              return (
                <button
                  key={official.id}
                  type="button"
                  className={`persona-btn ${isActive?'active':''}`}
                  onClick={()=>{
                    setSelectedPersonaId(official.id)
                    setCurrentUser(official)
                    setLoginEmail(official.email)
                    setLoginPassword('Aurexa@Gov2026')
                    notify(`Switched to ${official.name} (${official.role})`)
                  }}
                >
                  <div className="persona-top">
                    <div className={`persona-avatar ${official.color}`}>{official.initials}</div>
                    <span className="persona-badge">{official.clearance.split('·')[0].trim()}</span>
                  </div>
                  <div>
                    <span className="persona-name">{official.name}</span>
                    <span className="persona-role">{official.role}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="login-divider">
          <span>OR SIGN IN WITH CREDENTIALS</span>
        </div>

        <form onSubmit={handleLoginSubmit} className="login-inputs">
          <div className="login-input-wrap">
            <label>
              <span>Government Email / Officer ID</span>
              <span className="tiny-muted">{currentUser.department}</span>
            </label>
            <div className="login-input-box">
              <Mail size={15}/>
              <input
                type="email"
                value={loginEmail}
                onChange={e=>setLoginEmail(e.target.value)}
                placeholder="officer@aicte.gov.in"
                required
              />
            </div>
          </div>

          <div className="login-input-wrap">
            <label>
              <span>Security PIN / Passcode</span>
              <span className="tiny-muted">Default: Aurexa@Gov2026</span>
            </label>
            <div className="login-input-box">
              <Key size={15}/>
              <input
                type={showPassword?'text':'password'}
                value={loginPassword}
                onChange={e=>setLoginPassword(e.target.value)}
                placeholder="Enter security passcode"
                required
              />
              <button
                type="button"
                className="pw-toggle-btn"
                onClick={()=>setShowPassword(!showPassword)}
                title={showPassword?'Hide password':'Show password'}
              >
                {showPassword?<EyeOff size={15}/>:<Eye size={15}/>}
              </button>
            </div>
          </div>

          <div className="otp-bar">
            <span><b>2FA Token / Secure OTP:</b> Simulated Government OTP</span>
            <span
              className="otp-badge"
              onClick={()=>{setLoginOtp('849201');notify('Demo 2FA OTP applied.')}}
              title="Click to copy demo token"
            >
              {loginOtp}
            </span>
          </div>

          <div className="login-actions">
            <button type="submit" className="login-submit-btn">
              <ShieldCheck size={17}/> Sign in as {currentUser.name}
            </button>
            <button
              type="button"
              className="login-token-btn"
              onClick={()=>{
                setIsAuthenticated(true)
                notify(`Authenticated via Digilocker/NIC Officer Token as ${currentUser.name}`)
              }}
            >
              <Fingerprint size={16}/> Instant Biometric / Digital Token Login
            </button>
          </div>

          <p className="login-disclaimer">
            Notice: This portal is strictly for authorized regulatory scrutiny and institutional approval workflows. All access and reviewer actions are logged in the tamper-proof audit trail.
          </p>
        </form>
      </div>
    </div>
    {toast&&<div className="toast"><CheckCircleIcon/><span>{toast}</span><button onClick={()=>setToast('')}><X size={15}/></button></div>}
  </div>

  const renderOverview = ()=> <div className="page-stack">
    <div className="hero-strip"><div className="hero-copy"><div className="eyebrow"><span className="pulse-dot"/> REGULATORY SCRUTINY / OFFICIAL PORTAL</div><h2>Good evening, {currentUser?.name || 'Higher Official'}.</h2><p>Here’s your verification workspace at a glance. Prioritise evidence gaps, resolve inconsistencies, and keep every decision traceable.</p><div className="hero-actions"><Button onClick={()=>go('New verification')}><Icon I={Plus} size={16}/> Start verification</Button><Button variant="ghost-light" onClick={()=>go('AI review lab')}><Icon I={Sparkles} size={16}/> Explore AI review lab <ArrowRight size={15}/></Button></div></div><div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orb-core"><ShieldCheck size={46}/></div><div className="float-chip chip-a"><span className="chip-icon teal"><Check size={13}/></span><span><b>Evidence linked</b><small>Traceable findings</small></span></div><div className="float-chip chip-b"><span className="chip-icon purple"><Sparkles size={13}/></span><span><b>AI-assisted review</b><small>Human in control</small></span></div></div><div className="hero-foot"><span><Icon I={LockKeyhole} size={13}/> Clearance: {currentUser?.clearance || 'Class-3 Regulatory Scrutiny'}</span><span><Icon I={Activity} size={13}/> Authenticated via NIC Digital Key</span></div></div>
    <div className="metric-grid">
      <Metric title="Applications in queue" value={String(cases.length).padStart(2,'0')} delta="+12.5%" sub="vs. previous demo period" icon={Building2} tone="blue" />
      <Metric title="Need reviewer attention" value={String(cases.filter(c=>c.status==='Needs review'||c.status==='Ready for review').length).padStart(2,'0')} delta="Priority" sub="Based on demo triage" icon={AlertTriangle} tone="orange" />
      <Metric title="Open findings" value={String(findings.filter(f=>f.state!=='Resolved').length).padStart(2,'0')} delta="Across sample cases" sub="Evidence gaps & discrepancies" icon={FileSearch} tone="purple" />
      <Metric title="Evidence coverage" value="78%" delta="Illustrative" sub="Not a measured production KPI" icon={ShieldCheck} tone="green" />
    </div>
    <div className="grid-two dashboard-main">
      <Panel><SectionHead title="Review queue" sub="Applications requiring a closer look" action={<button className="text-link" onClick={()=>go('Applications')}>View all <ArrowRight size={14}/></button>}/><div className="table-wrap"><table><thead><tr><th>INSTITUTION / CASE</th><th>RISK PRIORITY</th><th>STATUS</th><th></th></tr></thead><tbody>{cases.slice(0,4).map(c=><tr key={c.id} onClick={()=>{setSelectedId(c.id);go('Investigation')}} className="click-row"><td><div className="institution-cell"><div className={`avatar ${c.color}`}>{c.initials}</div><div><b>{c.institution}</b><small>{c.id} · {c.type}</small></div></div></td><td><Risk value={c.risk}/></td><td><Status value={c.status}/></td><td><ChevronRight size={16} className="muted"/></td></tr>)}</tbody></table></div><div className="panel-bottom"><span className="tiny-muted">Sample cases for demonstration only</span><button className="icon-btn" onClick={()=>go('Applications')}><ArrowRight size={16}/></button></div></Panel>
      <Panel><SectionHead title="Review activity" sub="Recent workspace events" action={<button className="icon-btn" onClick={()=>go('Audit trail')}><ArrowRight size={16}/></button>}/><div className="activity-list">{activity.map((a,i)=><div className="activity-item" key={i}><div className={`activity-icon ${a.color}`}><a.icon size={17}/></div><div className="activity-text"><b>{a.title}</b><span>{a.sub}</span><small>{a.time}</small></div></div>)}</div></Panel>
    </div>
    <div className="grid-two">
      <Panel><SectionHead title="Verification throughput" sub="Illustrative trend · last 7 days" action={<Badge tone="blue">Demo data</Badge>}/><div className="chart-summary"><strong>207</strong><span><ArrowUpRight size={14}/> +8.4% <small>vs. previous period</small></span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{top:8,right:8,left:-22,bottom:0}}><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c7df4" stopOpacity={0.24}/><stop offset="100%" stopColor="#6c7df4" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e8ecf4"/><XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fill:'#929bb0',fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#929bb0',fontSize:11}}/><Tooltip/><Area type="monotone" dataKey="v" stroke="#6979ef" strokeWidth={2.5} fill="url(#trendFill)"/></AreaChart></ResponsiveContainer></div></Panel>
      <Panel><SectionHead title="Findings by category" sub="Where reviewers may need to focus" action={<button className="text-link" onClick={()=>go('Analytics & reports')}>Details <ArrowRight size={14}/></button>}/><div className="chart-area bar-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={barData} layout="vertical" margin={{top:3,right:10,left:5,bottom:0}}><CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="#e8ecf4"/><XAxis type="number" axisLine={false} tickLine={false} tick={{fill:'#929bb0',fontSize:10}}/><YAxis type="category" dataKey="name" width={92} axisLine={false} tickLine={false} tick={{fill:'#727e96',fontSize:11}}/><Tooltip/><Bar dataKey="flagged" fill="#8b8af8" radius={[0,5,5,0]} barSize={14}/></BarChart></ResponsiveContainer></div><p className="chart-note"><Info size={13}/> Illustrative counts, not production measurements.</p></Panel>
    </div>
    <div className="notice"><Icon I={ShieldAlert} size={18}/><div><b>Human review is built into the workflow</b><span>AI findings are advisory signals. Verify source evidence, applicable APH edition and official records before making an institutional decision.</span></div><button onClick={()=>go('APH rule studio')}>Review controls <ArrowRight size={14}/></button></div>
  </div>

  const renderApplications = ()=> <div className="page-stack">
    <div className="page-toolbar"><div className="search-box wide"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search institution, case ID, or application type…"/><kbd>⌘ K</kbd></div><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All statuses</option>{['Needs review','In analysis','Clarification sent','Ready for review','Approved by reviewer'].map(x=><option key={x}>{x}</option>)}</select><select value={riskFilter} onChange={e=>setRiskFilter(e.target.value)}><option>All risk levels</option>{['High risk','Medium risk','Low risk'].map(x=><option key={x}>{x}</option>)}</select><Button onClick={()=>go('New verification')}><Plus size={16}/> New application</Button></div>
    <Panel><SectionHead title={`${filteredCases.length} applications`} sub="Select a case to inspect evidence and findings." action={<Button variant="secondary" onClick={exportCSV}><Download size={15}/> Export CSV</Button>}/><div className="table-wrap"><table className="large-table"><thead><tr><th><input type="checkbox" aria-label="Select all"/></th><th>INSTITUTION</th><th>APPLICATION TYPE</th><th>SUBMITTED</th><th>RISK PRIORITY</th><th>FINDINGS</th><th>STATUS</th><th></th></tr></thead><tbody>{filteredCases.map(c=><tr key={c.id} className="click-row" onClick={()=>{setSelectedId(c.id);go('Investigation')}}><td><input type="checkbox" onClick={e=>e.stopPropagation()} aria-label={`Select ${c.id}`}/></td><td><div className="institution-cell"><div className={`avatar ${c.color}`}>{c.initials}</div><div><b>{c.institution}</b><small>{c.id} · Owner: {c.owner}</small></div></div></td><td>{c.type}</td><td className="muted">{c.submitted}</td><td><Risk value={c.risk}/></td><td><span className={c.findings?'finding-count':'finding-count clean'}>{c.findings}</span></td><td><Status value={c.status}/></td><td><ChevronRight size={16} className="muted"/></td></tr>)}</tbody></table>{!filteredCases.length&&<EmptyState icon={Search} title="No matching applications" sub="Try adjusting your search or filters."/>}</div><div className="table-footer"><span>Showing {filteredCases.length} of {cases.length} demo records</span><span>Sample data <span className="dot-sep">·</span> Updated 28 Oct 2026</span></div></Panel>
    <div className="grid-three"><MiniInfo icon={ShieldCheck} title="Evidence-first review" text="Every finding should reference a source field, document and page."/><MiniInfo icon={GitCompareArrows} title="Cross-document checks" text="Compare extracted facts across related documents before escalation."/><MiniInfo icon={UserCheck} title="Human decision control" text="No automated rejection or fraud determination is made by this prototype."/></div>
  </div>

  const renderNewVerification = ()=> <div className="page-stack">
    <div className="stepper"><div className="step active"><span>1</span><div><b>Case details</b><small>Identify the application</small></div></div><div className="step-line"/><div className={`step ${caseCreated?'active':''}`}><span>2</span><div><b>Evidence package</b><small>Select documents</small></div></div><div className="step-line"/><div className="step"><span>3</span><div><b>Run triage</b><small>Review signals</small></div></div></div>
    <div className="grid-two new-case-grid"><Panel><SectionHead title="Application profile" sub="Create a demo case in this browser session."/><div className="form-grid"><label className="field full"><span>Institution name <em>*</em></span><input value={institution} onChange={e=>setInstitution(e.target.value)} placeholder="e.g. Northbridge Institute of Technology"/></label><label className="field full"><span>Application title <em>*</em></span><input value={caseName} onChange={e=>setCaseName(e.target.value)} placeholder="e.g. 2026–27 Extension of Approval"/></label><label className="field full"><span>Application type</span><select value={caseType} onChange={e=>setCaseType(e.target.value)}>{['Extension of Approval','New Institution','New Course Addition','Intake Increase','Change of Institution Details'].map(x=><option key={x}>{x}</option>)}</select></label><label className="field"><span>Review cycle</span><input value="2026–27 (demo)" readOnly/></label><label className="field"><span>Rule set</span><input value="APH rules · demo version" readOnly/></label></div><div className="form-actions"><Button onClick={createCase}><Plus size={16}/> Create demo case</Button><span className="tiny-muted">No server request is made.</span></div>{caseCreated&&<div className="inline-success"><CheckCircleIcon/> Case created in the local UI state. Continue by selecting evidence files below.</div>}</Panel>
    <Panel><SectionHead title="Evidence package" sub="Choose local files to stage in the UI." action={<Badge tone="blue">Local only</Badge>}/><div className="upload-zone" onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFiles(e.dataTransfer.files)}}><div className="upload-icon"><Upload size={22}/></div><b>Drop documents here or browse files</b><span>PDF, PNG, JPG, DOCX or TXT · demo only</span><Button variant="secondary" onClick={e=>{e.stopPropagation();fileRef.current?.click()}}><FolderOpenIcon/> Browse files</Button><input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt" hidden onChange={e=>addFiles(e.target.files)}/></div><div className="privacy-line"><LockKeyhole size={14}/> Files remain in this browser session; no upload occurs.</div>{files.length>0&&<div className="file-list">{files.map((f,i)=><div className="file-row" key={`${f.name}-${i}`}><div className="file-icon"><FileText size={17}/></div><div className="file-meta"><b>{f.name}</b><small>{formatBytes(f.size)} {f.hash?`· SHA-256 ${f.hash.slice(0,14)}…`:''}</small></div><button className="text-link" onClick={()=>hashFile(f,i)}><Hash size={14}/> {f.hash?'Re-hash':'Fingerprint'}</button><button className="icon-btn" onClick={()=>setFiles(fs=>fs.filter((_,j)=>j!==i))}><X size={15}/></button></div>)}</div>}{files.length>0&&<Button block onClick={runDemoAnalysis} className="full-btn"><Sparkles size={16}/> Run demo triage on filenames</Button>}</Panel></div>
    <div className="notice"><Icon I={Info} size={18}/><div><b>Prototype limitation</b><span>The triage action uses filenames only. It does not perform OCR, inspect document contents, verify certificates or apply authoritative APH rules.</span></div><button onClick={()=>go('AI review lab')}>See AI roadmap <ArrowRight size={14}/></button></div>
  </div>

  const renderInvestigation = ()=> <div className="page-stack">
    <div className="case-banner"><div className={`avatar large ${selectedCase.color}`}>{selectedCase.initials}</div><div className="case-banner-main"><div className="case-eyebrow">{selectedCase.id} <span>•</span> {selectedCase.type}</div><h2>{selectedCase.institution}</h2><div className="case-meta"><span><CalendarClock size={14}/> Submitted {selectedCase.submitted}</span><span><Users size={14}/> Owner: {selectedCase.owner}</span><span><FileText size={14}/> {selectedCase.docs} documents</span></div></div><div className="case-banner-actions"><Status value={selectedCase.status}/><Button variant="secondary" onClick={exportReport}><Download size={15}/> Export review</Button></div></div>
    <div className="investigation-kpis"><div><span>Risk priority</span><strong className={selectedCase.risk>=70?'danger-text':selectedCase.risk>=40?'warn-text':'good-text'}>{selectedCase.risk}<small>/100</small></strong><small>Advisory demo score</small></div><div><span>Open findings</span><strong>{findings.filter(f=>f.state!=='Resolved').length}</strong><small>Across demo finding set</small></div><div><span>Evidence coverage</span><strong>78<small>%</small></strong><small>Illustrative only</small></div><div><span>Review status</span><strong className="status-word">{selectedCase.status}</strong><small>Human decision pending</small></div></div>
    <div className="investigation-grid"><div className="left-investigation"><Panel><SectionHead title="AI-assisted findings" sub="Select a finding to inspect its evidence and reasoning." action={<Badge tone="purple"><Sparkles size={12}/> Explainable signals</Badge>}/><div className="filter-row"><select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}><option>All categories</option>{[...new Set(findings.map(f=>f.category))].map(x=><option key={x}>{x}</option>)}</select><span className="tiny-muted">{filteredFindings.length} findings</span></div><div className="finding-list">{filteredFindings.map(f=><button key={f.id} className={`finding-card ${selectedFinding===f.id?'selected':''}`} onClick={()=>setSelectedFinding(f.id)}><div className="finding-top"><Badge tone={f.severity==='High'?'red':f.severity==='Medium'?'orange':'blue'} dot>{f.severity} priority</Badge><span className="finding-id">{f.id}</span></div><b>{f.title}</b><p>{f.detail}</p><div className="finding-foot"><span><FileSearch size={13}/> {f.category}</span><span className="confidence"><span className="confidence-bar"><i style={{width:`${f.confidence}%`}}/></span>{f.confidence}%</span></div><div className="finding-state"><Status value={f.state}/><span>{f.state==='Resolved'?'Resolved by reviewer':'Review required'}</span></div></button>)}</div></Panel></div>
    <div className="right-investigation"><Panel className="evidence-panel"><div className="evidence-head"><div><div className="eyebrow purple-text">FINDING DETAIL / {currentFinding.id}</div><h3>{currentFinding.title}</h3></div><button className="icon-btn" onClick={()=>setPage('AI review lab')} title="Open AI review lab"><Sparkles size={17}/></button></div><div className="evidence-tabs">{['Evidence','Reasoning','Reviewer action'].map(t=><button key={t} className={activeTab===t?'active':''} onClick={()=>setActiveTab(t)}>{t}</button>)}</div>{activeTab==='Evidence'?<div className="evidence-content"><div className="evidence-ref"><div className="file-icon"><FileText size={18}/></div><div><b>{currentFinding.evidence}</b><small>Reference labels are illustrative in this prototype</small></div><Badge tone="blue">Source link</Badge></div><div className="evidence-snippet"><div className="snippet-label"><Eye size={13}/> EXTRACTED VALUE COMPARISON</div><div className="comparison"><div><small>Application summary</small><strong>{currentFinding.id==='F-001'?'50 faculty':'Source field A'}</strong><span>Illustrative extraction</span></div><div className="compare-mark"><GitCompareArrows size={17}/></div><div><small>Supporting evidence</small><strong>{currentFinding.id==='F-001'?'42 faculty':'Source field B'}</strong><span>Illustrative extraction</span></div></div></div><div className="source-confidence"><span>Extraction confidence</span><b>{currentFinding.confidence}%</b><div className="confidence-bar wide"><i style={{width:`${currentFinding.confidence}%`}}/></div><small>Confidence reflects example metadata, not a live model score.</small></div></div>:activeTab==='Reasoning'?<div className="reasoning-content"><div className="reason-step"><span>01</span><div><b>Observed signal</b><p>{currentFinding.detail}</p></div></div><div className="reason-step"><span>02</span><div><b>Why it was flagged</b><p>{currentFinding.why}</p></div></div><div className="reason-step"><span>03</span><div><b>Recommended next step</b><p>{currentFinding.next}</p></div></div><div className="notice compact"><Info size={16}/><span>Do not infer intent or fraud from a discrepancy alone.</span></div></div>:<div className="review-action"><label className="field"><span>Reviewer note</span><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Record what you checked, which source was verified, and why…"/></label><div className="action-buttons"><Button variant="secondary" onClick={()=>{setNotes('');notify('Note field cleared.')}}>Clear</Button><Button onClick={()=>{if(!notes.trim()){notify('Add a reviewer note before saving.');return}notify('Reviewer note saved for this demo session.')}}><Check size={15}/> Save note</Button></div><div className="review-decision"><b>Reviewer outcome</b><p>Record a human decision only after checking the original evidence.</p><div className="decision-buttons"><Button variant="secondary" onClick={()=>{markFinding(currentFinding.id,'Resolved');setReviewDecision('Resolved after evidence review')}}><CheckCheck size={15}/> Resolve finding</Button><Button variant="secondary" onClick={downloadClarification}><MessageSquareText size={15}/> Request clarification</Button></div><label className="field"><span>Case recommendation (demo)</span><select value={reviewDecision} onChange={e=>setReviewDecision(e.target.value)}><option value="">Choose an outcome…</option><option>Continue review</option><option>Request more evidence</option><option>Resolved after evidence review</option><option>Escalate for authorised review</option></select></label></div></div>}</Panel><Panel><SectionHead title="Evidence provenance" sub="Minimum traceability fields for each finding"/><div className="provenance-list">{[['Source file','Document name and immutable ID'],['Source location','Page number, bounding box or field path'],['Extraction method','OCR/model version and timestamp'],['Confidence','Field-level confidence and review state'],['Rule applied','Rule ID, APH edition and clause reference']].map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>)}</div></Panel></div></div>
    <div className="notice"><Icon I={ShieldCheck} size={18}/><div><b>Decision safeguard</b><span>Resolving a finding only changes the demo UI. Final application decisions must be made by authorised officials using verified evidence and the applicable policy version.</span></div></div>
  </div>

  const renderAILab = ()=> {
    const featureMeta = {
      'cross-doc': { title: 'Cross-document reasoning', tag: 'CORE', icon: GitCompareArrows, desc: 'Reconcile entities across multiple uploaded documents with explainable delta analysis.' },
      'tamper': { title: 'Duplicate & tamper signals', tag: 'AUTHENTICITY', icon: Fingerprint, desc: 'Cryptographic SHA-256 fingerprinting and metadata anomaly indicators.' },
      'chronology': { title: 'Timeline consistency graph', tag: 'CHRONOLOGY', icon: CalendarClock, desc: 'Sequential logic check across certificate dates, approvals and inspection events.' },
      'copilot': { title: 'APH-grounded compliance copilot', tag: 'REGULATORY AI', icon: BookOpenCheck, desc: 'Semantically retrieves official APH clauses with strict grounding and abstention.' },
      'graph': { title: 'Cross-institution relationship graph', tag: 'GRAPH INTELLIGENCE', icon: Network, desc: 'Detect shared signatories, land survey boundaries, and common identifiers.' },
      'routing': { title: 'Confidence-aware review routing', tag: 'HUMAN-IN-LOOP', icon: UserCheck, desc: 'Automates high-confidence fields while queuing low-confidence extractions for manual review.' },
    }[labFeature] || { title: 'AI Feature Lab', tag: 'INTELLIGENCE', icon: Sparkles, desc: 'Interactive AI sandbox' }

    const scenariosForFeature = labScenarios[labFeature] || []
    const activeScenario = scenariosForFeature[scenarioIdx] || scenariosForFeature[0] || {}

    const customDelta = Number(customValA) - Number(customValB)
    const customPercent = customValA > 0 ? ((customDelta / customValA) * 100).toFixed(1) : 0
    const customMismatch = customDelta !== 0

    return <div className="page-stack">
      <div className="ai-hero">
        <div className="ai-orb"><Bot size={29}/><Sparkles size={16}/></div>
        <div>
          <div className="eyebrow purple-text">AUREXA INTELLIGENCE / INTERACTIVE TESTBENCH</div>
          <h2>From document checks to evidence intelligence.</h2>
          <p>Select any AI feature below to test how it works with pre-loaded demo case data or test your own custom values in the interactive sandbox.</p>
        </div>
        <Badge tone="purple">Live Interactive Lab</Badge>
      </div>

      {/* 6 Feature Selection Cards */}
      <div className="ai-feature-grid">
        <AIFeature icon={GitCompareArrows} tag="CORE" title="Cross-document reasoning" desc="Extract and reconcile entities across application forms, faculty registers and certificates." state="Interactive Sandbox" tone="purple" active={labFeature==='cross-doc'} onClick={()=>{setLabFeature('cross-doc');setScenarioIdx(0)}}/>
        <AIFeature icon={Fingerprint} tag="AUTHENTICITY" title="Duplicate & tamper signals" desc="Combine SHA-256 fingerprints, metadata anomalies and cross-case duplicates." state="Live Hash Analyzer" tone="blue" active={labFeature==='tamper'} onClick={()=>{setLabFeature('tamper');setScenarioIdx(0)}}/>
        <AIFeature icon={CalendarClock} tag="CHRONOLOGY" title="Timeline consistency graph" desc="Connect issue dates, validity windows and inspection dates; flag inverted sequences." state="Visual Sequence Graph" tone="teal" active={labFeature==='chronology'} onClick={()=>{setLabFeature('chronology');setScenarioIdx(0)}}/>
        <AIFeature icon={BookOpenCheck} tag="REGULATORY AI" title="APH-grounded compliance copilot" desc="Retrieve approved APH clauses, show clause/version/date and quote source passages." state="Grounded Corpus" tone="orange" active={labFeature==='copilot'} onClick={()=>{setLabFeature('copilot');setScenarioIdx(0)}}/>
        <AIFeature icon={Network} tag="GRAPH INTELLIGENCE" title="Cross-institution relationship graph" desc="Find shared trustees, contiguous land survey plots and common architects." state="Cluster Explorer" tone="purple" active={labFeature==='graph'} onClick={()=>{setLabFeature('graph');setScenarioIdx(0)}}/>
        <AIFeature icon={UserCheck} tag="HUMAN-IN-LOOP" title="Confidence-aware review routing" desc="Route OCR extractions into Express, Verification Band or Manual Correction Queue." state="Dynamic 3-Tier Routing" tone="green" active={labFeature==='routing'} onClick={()=>{setLabFeature('routing');setScenarioIdx(0)}}/>
      </div>

      {/* INTERACTIVE LAB WORKBENCH */}
      <div className="ai-workbench">
        {/* Workbench Header */}
        <div className="ai-workbench-head">
          <div className="ai-workbench-title">
            <div className="ai-workbench-icon">
              <Icon I={featureMeta.icon} size={22}/>
            </div>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <h3>{featureMeta.title}</h3>
                <Badge tone="blue">{featureMeta.tag}</Badge>
              </div>
              <p>{featureMeta.desc}</p>
            </div>
          </div>

          {/* Segmented Source Switcher */}
          <div className="source-toggle-wrap">
            <button
              className={`source-toggle-btn ${labSource==='previous'?'active':''}`}
              onClick={()=>{setLabSource('previous');setScenarioIdx(0);notify('Loaded previous case data.')}}
            >
              <History size={13}/> Use previous data we used
            </button>
            <button
              className={`source-toggle-btn ${labSource==='new'?'active':''}`}
              onClick={()=>{setLabSource('new');notify('Switched to custom testbench mode.')}}
            >
              <Plus size={13}/> Add / Test new data
            </button>
          </div>
        </div>

        {/* Scenario Picker Bar (Active when in 'previous' mode) */}
        {labSource === 'previous' && (
          <div className="scenario-bar">
            <div className="scenario-label">
              <FileSearch size={13}/> Previous cases:
            </div>
            <div className="scenario-pills">
              {scenariosForFeature.map((sc, i) => (
                <button
                  key={sc.id}
                  className={`scenario-pill ${scenarioIdx === i ? 'active' : ''}`}
                  onClick={()=>setScenarioIdx(i)}
                >
                  <b>{sc.title}</b>
                  <small style={{opacity:.8}}>· {sc.case?.split('·')[1]?.trim() || sc.case || ''}</small>
                </button>
              ))}
              {files.length > 0 && (
                <button
                  className="scenario-pill"
                  onClick={()=>{notify(`Using ${files.length} uploaded file(s) from current verification package.`)}}
                  title="User uploaded documents"
                >
                  <Upload size={12}/> Current uploaded package ({files.length} files)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Workbench Body */}
        <div className="lab-body">
          {/* LEFT COLUMN: Input / Case Evidence Context */}
          <div className="lab-input-card">
            <div className="lab-card-title">
              <span>
                {labSource==='previous' ? <History size={15}/> : <Sliders size={15}/>}
                {labSource==='previous' ? 'Case Evidence & Context' : 'Custom Input Parameters'}
              </span>
              <Badge tone={labSource==='previous'?'purple':'green'}>
                {labSource==='previous' ? activeScenario.case : 'Custom Simulation'}
              </Badge>
            </div>

            {/* Conditional Inputs based on labFeature and labSource */}
            {labFeature === 'cross-doc' && (
              labSource === 'previous' ? (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="lab-field">
                    <label>Reconciled Entity</label>
                    <input readOnly value={`${activeScenario.entity || ''} (${activeScenario.unit || ''})`}/>
                  </div>
                  <div className="lab-fields-grid">
                    <div className="lab-field">
                      <label>Source Document A</label>
                      <input readOnly value={activeScenario.docA?.name || ''}/>
                      <small className="tiny-muted">{activeScenario.docA?.context || ''}</small>
                    </div>
                    <div className="lab-field">
                      <label>Source Document B</label>
                      <input readOnly value={activeScenario.docB?.name || ''}/>
                      <small className="tiny-muted">{activeScenario.docB?.context || ''}</small>
                    </div>
                  </div>
                  <div className="lab-field">
                    <label>Governing Verification Rule</label>
                    <input readOnly value={activeScenario.rule || ''}/>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="lab-fields-grid">
                    <div className="lab-field">
                      <label>Entity / Metric Name</label>
                      <input value={customEntity} onChange={e=>setCustomEntity(e.target.value)} placeholder="e.g. Faculty Count"/>
                    </div>
                    <div className="lab-field">
                      <label>Unit of Measure</label>
                      <input value={customUnit} onChange={e=>setCustomUnit(e.target.value)} placeholder="e.g. Members, Acres"/>
                    </div>
                  </div>
                  <div className="lab-fields-grid">
                    <div className="lab-field">
                      <label>Document 1 Name</label>
                      <input value={customDocA} onChange={e=>setCustomDocA(e.target.value)}/>
                    </div>
                    <div className="lab-field">
                      <label>Document 1 Extracted Value</label>
                      <input type="number" value={customValA} onChange={e=>setCustomValA(Number(e.target.value))}/>
                    </div>
                  </div>
                  <div className="lab-fields-grid">
                    <div className="lab-field">
                      <label>Document 2 Name</label>
                      <input value={customDocB} onChange={e=>setCustomDocB(e.target.value)}/>
                    </div>
                    <div className="lab-field">
                      <label>Document 2 Extracted Value</label>
                      <input type="number" value={customValB} onChange={e=>setCustomValB(Number(e.target.value))}/>
                    </div>
                  </div>
                  <Button sm onClick={()=>notify('Cross-document calculation updated.')}>
                    <Play size={13}/> Run Cross-Document Reasoning
                  </Button>
                </div>
              )
            )}

            {labFeature === 'tamper' && (
              labSource === 'previous' ? (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="lab-field">
                    <label>Evidence Filename</label>
                    <input readOnly value={`${activeScenario.fileName || ''} (${activeScenario.fileSize || ''})`}/>
                  </div>
                  <div className="lab-field">
                    <label>Metadata Inspection Status</label>
                    <input readOnly value={activeScenario.metadataStatus || ''}/>
                  </div>
                  <div className="lab-field">
                    <label>PDF Producer / Stream Signatures</label>
                    <input readOnly value={activeScenario.producer || ''}/>
                  </div>
                  <div className="lab-field">
                    <label>Forensic Signal</label>
                    <input readOnly value={activeScenario.tamperCue || ''}/>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="lab-field">
                    <label>Upload Local Document OR Paste Sample Content</label>
                    <input
                      type="file"
                      onChange={handleLabUpload}
                      style={{padding:'6px',fontSize:10}}
                    />
                  </div>
                  <div className="lab-field">
                    <label>Or Type / Paste Text Payload</label>
                    <textarea
                      rows={3}
                      value={customFileText}
                      onChange={e=>{setCustomFileText(e.target.value);computeHashForText(e.target.value)}}
                      placeholder="Type any content to calculate its live SHA-256 fingerprint…"
                    />
                  </div>
                  <div className="lab-field">
                    <label>Simulate Metadata Anomaly</label>
                    <select value={customTamperAnomaly} onChange={e=>setCustomTamperAnomaly(e.target.value)}>
                      <option>None (Clean File)</option>
                      <option>Clock Skew (Modified date precedes creation date)</option>
                      <option>Photoshop / Post-Processing Stream Detected</option>
                      <option>Cross-Case Collision (Duplicate of Case AUV-2026-1048)</option>
                    </select>
                  </div>
                  <Button sm onClick={()=>{computeHashForText(customFileText);notify('Calculated live hash and inspected metadata.')}}>
                    <Fingerprint size={13}/> Inspect Fingerprint & Forensics
                  </Button>
                </div>
              )
            )}

            {labFeature === 'chronology' && (
              labSource === 'previous' ? (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="lab-field">
                    <label>Inspection Scenario</label>
                    <input readOnly value={activeScenario.title || ''}/>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    <label style={{fontSize:9,fontWeight:700,color:'#67748f'}}>Event Sequence Log</label>
                    {activeScenario.events?.map((ev, idx)=>(
                      <div key={idx} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:'#fff',border:'1px solid #e5eaf3',borderRadius:6,fontSize:10}}>
                        <div>
                          <b>{ev.name}</b>
                          <div className="tiny-muted">{ev.note}</div>
                        </div>
                        <Badge tone={ev.valid?'green':'red'}>{ev.date}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {customEvents.map((ev, idx)=>(
                    <div className="lab-fields-grid" key={idx}>
                      <div className="lab-field">
                        <label>Event {idx+1} Milestone</label>
                        <input
                          value={ev.name}
                          onChange={e=>{
                            const copy = [...customEvents]
                            copy[idx].name = e.target.value
                            setCustomEvents(copy)
                          }}
                        />
                      </div>
                      <div className="lab-field">
                        <label>Date (YYYY-MM-DD)</label>
                        <input
                          type="date"
                          value={ev.date}
                          onChange={e=>{
                            const copy = [...customEvents]
                            copy[idx].date = e.target.value
                            setCustomEvents(copy)
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div style={{display:'flex',gap:8}}>
                    <Button sm variant="secondary" onClick={()=>{
                      setCustomEvents([
                        { name: 'Application Submission', date: '2026-03-01' },
                        { name: 'On-site Inspection Completed', date: '2026-05-15' },
                        { name: 'Fire Safety Certificate Issued', date: '2026-06-20' },
                      ])
                      notify('Reset to example conflict sequence.')
                    }}>
                      <RotateCcw size={12}/> Reset Sequence
                    </Button>
                    <Button sm onClick={()=>notify('Timeline validated.')}>
                      <Play size={12}/> Validate Chronology
                    </Button>
                  </div>
                </div>
              )
            )}

            {labFeature === 'copilot' && (
              labSource === 'previous' ? (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="lab-field">
                    <label>Sample Query</label>
                    <input readOnly value={activeScenario.query || ''}/>
                  </div>
                  <div className="lab-fields-grid">
                    <div className="lab-field">
                      <label>Target Clause</label>
                      <input readOnly value={activeScenario.clauseId || ''}/>
                    </div>
                    <div className="lab-field">
                      <label>Category</label>
                      <input readOnly value={activeScenario.category || ''}/>
                    </div>
                  </div>
                  <div className="lab-field">
                    <label>Applicability Scope</label>
                    <input readOnly value={activeScenario.applicability || ''}/>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="lab-field">
                    <label>Enter Regulatory Query or Clause</label>
                    <input
                      value={customCopilotQuery}
                      onChange={e=>setCustomCopilotQuery(e.target.value)}
                      placeholder="e.g. What is the required land area for pharmacy college?"
                    />
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {['What is the land requirement for Engineering?', 'Mandatory principal qualifications', 'Can intake be increased without NBA?'].map(p=>(
                      <button key={p} className="scenario-pill" onClick={()=>setCustomCopilotQuery(p)}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <Button sm onClick={()=>{
                    const q = customCopilotQuery.toLowerCase()
                    let match = {
                      clauseId: 'APH 2026–27 § 3.4.1',
                      passage: 'Technical institutions seeking approval or expansion must maintain unencumbered registered land title with designated municipal demarcation.',
                      confidence: '95% Grounded Semantic Match',
                      scope: 'All Disciplines · Chapter III Norms'
                    }
                    if (q.includes('principal') || q.includes('qualif')) {
                      match = {
                        clauseId: 'APH 2026–27 § 4.1.2',
                        passage: 'The Principal / Director of an Engineering institution shall hold a Ph.D. degree with minimum 10 years experience in teaching / research / industry.',
                        confidence: '97% Grounded Semantic Match',
                        scope: 'Faculty & Administrative Governance'
                      }
                    } else if (q.includes('nba') || q.includes('intake')) {
                      match = {
                        clauseId: 'APH 2026–27 § 5.2.3',
                        passage: 'Introduction of new courses or increase in intake in existing programs requires minimum 50% eligible courses to be NBA accredited.',
                        confidence: '94% Grounded Semantic Match',
                        scope: 'Intake Expansion & Quality Norms'
                      }
                    }
                    setCustomCopilotResult(match)
                    notify('Grounded APH retrieval executed.')
                  }}>
                    <Search size={13}/> Retrieve Grounded Clause
                  </Button>
                </div>
              )
            )}

            {labFeature === 'graph' && (
              labSource === 'previous' ? (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="lab-field">
                    <label>Connected Case Entities</label>
                    <input readOnly value={activeScenario.case || ''}/>
                  </div>
                  <div className="lab-field">
                    <label>Shared Node / Attribute</label>
                    <input readOnly value={activeScenario.entityName || ''}/>
                  </div>
                  <div className="lab-field">
                    <label>Link Type</label>
                    <input readOnly value={activeScenario.linkType || ''}/>
                  </div>
                  <div className="lab-field">
                    <label>Evidence Overlap</label>
                    <textarea readOnly rows={3} value={activeScenario.overlapDetails || ''}/>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="lab-fields-grid">
                    <div className="lab-field">
                      <label>Institution A</label>
                      <input value={customInstA} onChange={e=>setCustomInstA(e.target.value)}/>
                    </div>
                    <div className="lab-field">
                      <label>Institution B</label>
                      <input value={customInstB} onChange={e=>setCustomInstB(e.target.value)}/>
                    </div>
                  </div>
                  <div className="lab-field">
                    <label>Relationship Basis</label>
                    <select value={customLinkBasis} onChange={e=>setCustomLinkBasis(e.target.value)}>
                      <option>Shared Trustee & Common Signatory (PAN Match)</option>
                      <option>Contiguous Survey Land & Adjoining Plot</option>
                      <option>Identical Architectural Structural Certificate</option>
                      <option>Shared Registered Phone / Domain Registrar</option>
                    </select>
                  </div>
                  <div className="lab-field">
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <label>Link Confidence Weight</label>
                      <b>{customLinkWeight}%</b>
                    </div>
                    <input type="range" min="40" max="99" value={customLinkWeight} onChange={e=>setCustomLinkWeight(Number(e.target.value))}/>
                  </div>
                  <Button sm onClick={()=>notify('Relationship graph link simulated.')}>
                    <Network size={13}/> Map Inter-Case Relationship
                  </Button>
                </div>
              )
            )}

            {labFeature === 'routing' && (
              labSource === 'previous' ? (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="lab-field">
                    <label>Extracted Field Name</label>
                    <input readOnly value={activeScenario.field || ''}/>
                  </div>
                  <div className="lab-field">
                    <label>Extracted Value</label>
                    <input readOnly value={activeScenario.extractedValue || ''}/>
                  </div>
                  <div className="lab-field">
                    <label>Evidence Source Reference</label>
                    <input readOnly value={activeScenario.source || ''}/>
                  </div>
                  <div className="lab-field">
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <label>OCR Confidence Score</label>
                      <b>{activeScenario.confidence || 0}%</b>
                    </div>
                    <div className="confidence-bar wide">
                      <i style={{width:`${activeScenario.confidence || 0}%`}}/>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="lab-field">
                    <label>Field Name</label>
                    <input value={customFieldName} onChange={e=>setCustomFieldName(e.target.value)}/>
                  </div>
                  <div className="lab-field">
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <label>OCR Extraction Confidence</label>
                      <strong style={{color:'#686ff0'}}>{customConf}%</strong>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="99"
                      value={customConf}
                      onChange={e=>setCustomConf(Number(e.target.value))}
                      style={{accentColor:'#686ff0'}}
                    />
                    <div className="range-labels">
                      <span>Low quality scan (20%)</span>
                      <span>Near perfect OCR (99%)</span>
                    </div>
                  </div>
                  <div className="lab-field">
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <label>Review Routing Threshold</label>
                      <b>{threshold}% (Global)</b>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      step="5"
                      value={threshold}
                      onChange={e=>setThreshold(Number(e.target.value))}
                    />
                  </div>
                </div>
              )
            )}
          </div>

          {/* RIGHT COLUMN: Live AI Execution, Results & Reasoning */}
          <div className="lab-result-card">
            <div className="lab-result-header">
              <b>
                <Sparkles size={16} style={{verticalAlign:'middle',marginRight:6,color:'#686ff0'}}/>
                Live AI Execution & Evidence Reasoning
              </b>
              <Badge tone="purple">Deterministic Reasoning</Badge>
            </div>

            {/* Feature 1 Output: Cross-Doc */}
            {labFeature === 'cross-doc' && (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="lab-comparison-split">
                  <div className="lab-doc-box">
                    <div className="lab-doc-tag"><FileText size={12}/> {labSource==='previous'?activeScenario.docA?.name:customDocA}</div>
                    <div className="lab-doc-val">{labSource==='previous'?activeScenario.docA?.value:customValA} <small style={{fontSize:11,color:'#8995ac'}}>{labSource==='previous'?activeScenario.unit:customUnit}</small></div>
                    <div className="lab-doc-desc">Extraction Confidence: {labSource==='previous'?activeScenario.docA?.confidence:95}%</div>
                  </div>
                  <div className="lab-vs-badge"><GitCompareArrows size={17}/></div>
                  <div className="lab-doc-box">
                    <div className="lab-doc-tag"><FileText size={12}/> {labSource==='previous'?activeScenario.docB?.name:customDocB}</div>
                    <div className="lab-doc-val">{labSource==='previous'?activeScenario.docB?.value:customValB} <small style={{fontSize:11,color:'#8995ac'}}>{labSource==='previous'?activeScenario.unit:customUnit}</small></div>
                    <div className="lab-doc-desc">Extraction Confidence: {labSource==='previous'?activeScenario.docB?.confidence:92}%</div>
                  </div>
                </div>

                {/* Variance Banner */}
                {(labSource==='previous' ? activeScenario.delta !== 0 : customMismatch) ? (
                  <div className="lab-delta-banner mismatch">
                    <div className="lab-delta-info">
                      <b>Discrepancy Detected: {labSource==='previous'?activeScenario.delta:customDelta} {labSource==='previous'?activeScenario.unit:customUnit} ({labSource==='previous'?activeScenario.percent:customPercent}%)</b>
                      <span>Entity values diverge across primary application declaration and supporting register attachment.</span>
                    </div>
                    <Badge tone="red">Mismatch</Badge>
                  </div>
                ) : (
                  <div className="lab-delta-banner match">
                    <div className="lab-delta-info">
                      <b>Reconciliation Verified: 100% Consistent (0 Discrepancy)</b>
                      <span>Extracted metrics match perfectly across both documentary sources.</span>
                    </div>
                    <Badge tone="green">Verified</Badge>
                  </div>
                )}

                {/* Explainable AI Trail */}
                <div className="lab-steps-trail">
                  <div className="lab-step-row">
                    <div className="lab-step-num">01</div>
                    <div className="lab-step-content">
                      <b>Entity Extraction & Normalization</b>
                      <p>Standardized entity tokens for {labSource==='previous'?activeScenario.entity:customEntity} across both documents into common units.</p>
                    </div>
                  </div>
                  <div className="lab-step-row">
                    <div className="lab-step-num">02</div>
                    <div className="lab-step-content">
                      <b>Cross-Source Consistency Check</b>
                      <p>{labSource==='previous'?activeScenario.analysis:`Comparing ${customValA} vs ${customValB}. Variance calculated as ${customDelta} (${customPercent}%).`}</p>
                    </div>
                  </div>
                  <div className="lab-step-row">
                    <div className="lab-step-num">03</div>
                    <div className="lab-step-content">
                      <b>Reviewer Recommendation</b>
                      <p>{labSource==='previous'?activeScenario.recommendation:(customMismatch?'Raise clarification letter to reconcile difference before committee review.':'Mark finding as cleared; evidence is self-consistent.')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 2 Output: Tamper & Duplicate */}
            {labFeature === 'tamper' && (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="hash-terminal">
                  <div className="hash-terminal-header">
                    <span><Fingerprint size={12}/> Cryptographic SHA-256 Digest</span>
                    <button
                      onClick={()=>{
                        const h = labSource==='previous'?activeScenario.hash:customFileHash
                        navigator.clipboard?.writeText(h)
                        notify('SHA-256 copied to clipboard.')
                      }}
                      style={{background:'transparent',border:0,color:'#8cf3d4',cursor:'pointer',fontSize:9,display:'flex',alignItems:'center',gap:4}}
                    >
                      <Copy size={11}/> Copy
                    </button>
                  </div>
                  <div className="hash-code">
                    {labSource==='previous'?activeScenario.hash:customFileHash}
                  </div>
                </div>

                {/* 3-Tier Authenticity Matrix */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  <div style={{background:'#f9fafc',border:'1px solid #edf1f7',borderRadius:8,padding:10,textAlign:'center'}}>
                    <small style={{fontSize:8,color:'#8c98ad',display:'block'}}>1. Hash Uniqueness</small>
                    <b style={{fontSize:10,color:(labSource==='previous'?activeScenario.matchFound:customTamperAnomaly.includes('Collision'))?'#e4515a':'#20a177'}}>
                      {(labSource==='previous'?activeScenario.matchFound:customTamperAnomaly.includes('Collision'))?'Duplicate Detected':'Unique Hash'}
                    </b>
                  </div>
                  <div style={{background:'#f9fafc',border:'1px solid #edf1f7',borderRadius:8,padding:10,textAlign:'center'}}>
                    <small style={{fontSize:8,color:'#8c98ad',display:'block'}}>2. Metadata Skew</small>
                    <b style={{fontSize:10,color:(labSource==='previous'?activeScenario.metadataStatus?.includes('Clock'):customTamperAnomaly.includes('Clock'))?'#e59632':'#20a177'}}>
                      {(labSource==='previous'?activeScenario.metadataStatus?.includes('Clock'):customTamperAnomaly.includes('Clock'))?'Skew Inverted':'Consistent'}
                    </b>
                  </div>
                  <div style={{background:'#f9fafc',border:'1px solid #edf1f7',borderRadius:8,padding:10,textAlign:'center'}}>
                    <small style={{fontSize:8,color:'#8c98ad',display:'block'}}>3. Visual Forensics</small>
                    <b style={{fontSize:10,color:(labSource==='previous'?false:customTamperAnomaly.includes('Photoshop'))?'#e4515a':'#20a177'}}>
                      {(labSource==='previous'?false:customTamperAnomaly.includes('Photoshop'))?'Post-Processed':'Normal Stream'}
                    </b>
                  </div>
                </div>

                <div className={`lab-delta-banner ${labSource==='previous'?activeScenario.tone:(customTamperAnomaly.includes('Collision')||customTamperAnomaly.includes('Photoshop')?'mismatch':'match')}`}>
                  <div className="lab-delta-info">
                    <b>{labSource==='previous' ? activeScenario.conclusion : (customTamperAnomaly.includes('Collision') ? 'Collision Alert: Exact file hash matches existing case file.' : customTamperAnomaly.includes('Clock') ? 'Metadata Warning: File timestamps show chronological inversion.' : 'Document authenticity signals clean. No duplicate hash collision in database.')}</b>
                    <span>Signals provide explainable forensic indicators to assist human reviewers—not automated accusations.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 3 Output: Chronology */}
            {labFeature === 'chronology' && (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div className="timeline-flow">
                  {(labSource==='previous'?activeScenario.events:customEvents)?.map((ev, i, arr)=>{
                    const isConflict = labSource==='previous' ? !ev.valid : (i > 0 && new Date(ev.date) < new Date(arr[i-1].date))
                    return (
                      <div key={i} className={`timeline-node ${isConflict?'conflict':'passed'}`}>
                        <div className="timeline-dot">{i+1}</div>
                        <b>{ev.name}</b>
                        <small>{ev.date}</small>
                      </div>
                    )
                  })}
                </div>

                {/* Conflict banner */}
                {(labSource==='previous' ? activeScenario.conflict : (new Date(customEvents[1]?.date) < new Date(customEvents[0]?.date) || new Date(customEvents[2]?.date) < new Date(customEvents[1]?.date))) ? (
                  <div className="lab-delta-banner mismatch">
                    <div className="lab-delta-info">
                      <b>Timeline Sequence Anomaly Detected</b>
                      <span>{labSource==='previous'?activeScenario.conflictMessage:'Event date occurs prior to prerequisite statutory milestone date.'}</span>
                    </div>
                    <Badge tone="red">Conflict</Badge>
                  </div>
                ) : (
                  <div className="lab-delta-banner match">
                    <div className="lab-delta-info">
                      <b>Chronological Order Verified</b>
                      <span>All institutional approvals, certificates, and inspection events follow a valid chronological sequence.</span>
                    </div>
                    <Badge tone="green">Valid</Badge>
                  </div>
                )}

                <div className="lab-steps-trail">
                  <div className="lab-step-row">
                    <div className="lab-step-num">01</div>
                    <div className="lab-step-content">
                      <b>Temporal Normalization</b>
                      <p>Extracted ISO-8601 dates from heterogeneous formats across inspection certificates and council affidavits.</p>
                    </div>
                  </div>
                  <div className="lab-step-row">
                    <div className="lab-step-num">02</div>
                    <div className="lab-step-content">
                      <b>Statutory Dependency Enforcement</b>
                      <p>Validates that mandatory prerequisites (fire clearance, building approval) precede inspection and EoA filing.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 4 Output: APH Copilot */}
            {labFeature === 'copilot' && (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div style={{background:'#fdfdfe',border:'1px solid #e5eaf5',borderRadius:10,padding:14}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:7}}>
                      <BookOpenCheck size={16} color="#686ff0"/>
                      <b style={{fontSize:11,color:'#323e59'}}>{labSource==='previous'?activeScenario.clauseId:(customCopilotResult?.clauseId || 'APH 2026–27 § 4.2.1')}</b>
                    </div>
                    <Badge tone="blue">{labSource==='previous'?activeScenario.confidence:(customCopilotResult?.confidence || '96% Grounded Match')}</Badge>
                  </div>
                  <blockquote style={{margin:'8px 0',padding:'10px 12px',background:'#f5f7fc',borderLeft:'3px solid #686ff0',fontSize:9.5,color:'#3c4864',lineHeight:1.7}}>
                    "{labSource==='previous'?activeScenario.officialPassage:(customCopilotResult?.passage || 'For Undergraduate Engineering and Technology programs, the required Faculty:Student ratio shall be 1:20. The cadre ratio shall ideally be maintained as 1:2:6.')}"
                  </blockquote>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:8.5,color:'#8995ad',marginTop:8}}>
                    <span>Corpus: AICTE Approval Process Handbook 2026–27 (Verified Edition)</span>
                    <span>Scope: {labSource==='previous'?activeScenario.applicability:(customCopilotResult?.scope || 'Engineering & Technology UG')}</span>
                  </div>
                </div>

                <div className="lab-delta-banner match">
                  <div className="lab-delta-info">
                    <b>Strict Evidence Grounding & Abstention Guardrail Active</b>
                    <span>The copilot only cites verified clauses from the approved handbook. If supporting case documents do not substantiate compliance, the copilot explicitly abstains.</span>
                  </div>
                  <Badge tone="purple">Safe AI</Badge>
                </div>
              </div>
            )}

            {/* Feature 5 Output: Relationship Graph */}
            {labFeature === 'graph' && (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <div style={{background:'#f9fafc',border:'1px solid #edf1f7',borderRadius:10,padding:14}}>
                  <div style={{display:'center',alignItems:'center',gap:8,marginBottom:10}}>
                    <b style={{fontSize:11,color:'#2d3953',display:'flex',alignItems:'center',gap:7}}>
                      <Network size={16} color="#686ff0"/>
                      Entity Resolution: {labSource==='previous'?activeScenario.entityName:`Link: ${customInstA} ↔ ${customInstB}`}
                    </b>
                  </div>
                  <div className="lab-fields-grid" style={{marginBottom:10}}>
                    <div className="lab-doc-box">
                      <small className="tiny-muted">Institution A</small>
                      <b style={{fontSize:11,display:'block',marginTop:3}}>{labSource==='previous'?'Northbridge Institute (Case 1048)':customInstA}</b>
                    </div>
                    <div className="lab-doc-box">
                      <small className="tiny-muted">Institution B</small>
                      <b style={{fontSize:11,display:'block',marginTop:3}}>{labSource==='previous'?'Greenfield College (Case 1047)':customInstB}</b>
                    </div>
                  </div>
                  <div style={{fontSize:9.5,color:'#56637b',lineHeight:1.6}}>
                    {labSource==='previous'?activeScenario.overlapDetails:`Shared attribute identified: ${customLinkBasis}. Match confidence computed at ${customLinkWeight}%.`}
                  </div>
                </div>

                <div className="lab-delta-banner warning">
                  <div className="lab-delta-info">
                    <b>Regulatory Review Alert: Potential Shared Governance / Assets</b>
                    <span>{labSource==='previous'?activeScenario.riskSignal:'Common identifiers across distinct applications require reviewer confirmation to ensure asset independence.'}</span>
                  </div>
                  <Badge tone="orange">Review Note</Badge>
                </div>
              </div>
            )}

            {/* Feature 6 Output: Confidence Routing */}
            {labFeature === 'routing' && (() => {
              const confScore = labSource === 'previous' ? (activeScenario.confidence || 0) : customConf
              const currentThresh = threshold
              const highBand = Math.min(99, currentThresh + 15)
              const isHigh = confScore >= highBand
              const isMed = confScore >= currentThresh && confScore < highBand
              const isLow = confScore < currentThresh

              return (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#f9fafc',border:'1px solid #edf1f7',borderRadius:10,padding:'12px 14px'}}>
                    <div>
                      <small className="tiny-muted">Evaluated Extraction</small>
                      <b style={{fontSize:12,color:'#313e59',display:'block',marginTop:3}}>
                        {labSource==='previous'?activeScenario.field:customFieldName}
                      </b>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <small className="tiny-muted">Model Confidence</small>
                      <strong style={{fontSize:18,color:isHigh?'#20a177':isMed?'#e59632':'#e4515a',display:'block'}}>
                        {confScore}%
                      </strong>
                    </div>
                  </div>

                  {/* 3-Tier Routing Gauge */}
                  <div className="routing-gauge">
                    <div className={`routing-tier green ${isHigh?'active':''}`}>
                      <span className="quality-dot green" style={{margin:'0 auto 6px'}}/>
                      <b>Express Lane</b>
                      <small>≥ {highBand}% · Auto-Assist</small>
                    </div>
                    <div className={`routing-tier orange ${isMed?'active':''}`}>
                      <span className="quality-dot orange" style={{margin:'0 auto 6px'}}/>
                      <b>Verification Band</b>
                      <small>{currentThresh}%–{highBand-1}% · Highlight</small>
                    </div>
                    <div className={`routing-tier red ${isLow?'active':''}`}>
                      <span className="quality-dot red" style={{margin:'0 auto 6px'}}/>
                      <b>Manual Queue</b>
                      <small>&lt; {currentThresh}% · Human Fix</small>
                    </div>
                  </div>

                  <div className={`lab-delta-banner ${isHigh?'match':isMed?'warning':'mismatch'}`}>
                    <div className="lab-delta-info">
                      <b>Routing Decision: {isHigh ? 'Automated Pre-fill with One-Click Approval' : isMed ? 'Reviewer Highlighted Source Verification' : 'Low Confidence — Routed to Bounding Box Correction Queue'}</b>
                      <span>{isHigh ? 'Extraction exceeds high-confidence criteria. Field is auto-populated for reviewer sign-off.' : isMed ? 'Confidence falls in review band. Extracted value is visually highlighted alongside source scan.' : 'OCR score falls below the configured threshold. Reviewer must manually inspect and key in the field.'}</span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Existing Q&A and Threshold Sliders */}
      <div className="grid-two">
        <Panel>
          <SectionHead title="Compliance copilot" sub="Ask about a demo finding or review process." action={<Badge tone="orange">No LLM connection</Badge>}/>
          <div className="copilot-thread">
            <div className="copilot-message">
              <div className="copilot-avatar"><Bot size={17}/></div>
              <div>
                <b>Aurexa assistant <Badge tone="gray">Demo</Badge></b>
                <p>I can demonstrate a safe, evidence-first response pattern. Answers are rule-based examples, not sourced from an official APH corpus.</p>
              </div>
            </div>
            {answer && (
              <div className="copilot-answer">
                <div className="answer-title"><Sparkles size={16}/><b>{answer.title}</b><Badge tone="blue">{answer.confidence}</Badge></div>
                <p>{answer.text}</p>
                <div className="answer-evidence">
                  <b>Evidence / source requirements</b>
                  {answer.evidence.map((e,i)=><span key={i}><FileText size={13}/>{e}</span>)}
                </div>
                <div className="answer-caution"><Info size={14}/>{answer.caution}</div>
              </div>
            )}
          </div>
          <div className="prompt-chips">
            {['Explain faculty mismatch','How should APH rules be checked?','What does a duplicate hash mean?'].map(x=>(
              <button key={x} onClick={()=>setQuery(x)}>{x}</button>
            ))}
          </div>
          <div className="copilot-input">
            <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&runCopilot()} placeholder="Ask a review question…"/>
            <Button onClick={runCopilot}><Send size={15}/> Ask</Button>
          </div>
        </Panel>

        <Panel>
          <SectionHead title="AI quality controls" sub="Confidence-aware review routing"/>
          <div className="threshold-control">
            <div><span>Manual review threshold</span><strong>{threshold}%</strong></div>
            <input type="range" min="50" max="95" step="5" value={threshold} onChange={e=>setThreshold(Number(e.target.value))}/>
            <div className="range-labels"><span>More automation · 50%</span><span>More manual review · 95%</span></div>
          </div>
          <div className="quality-list">
            <div><span className="quality-dot green"/><div><b>High confidence</b><small>≥ {Math.min(99,threshold+15)}% · auto-prepare result, reviewer still approves</small></div><Badge tone="green">Assist</Badge></div>
            <div><span className="quality-dot orange"/><div><b>Review band</b><small>{threshold}%–{Math.min(99,threshold+14)}% · verify source</small></div><Badge tone="orange">Check</Badge></div>
            <div><span className="quality-dot red"/><div><b>Low confidence</b><small>Below {threshold}% · manual correction queue</small></div><Badge tone="red">Review</Badge></div>
          </div>
          <div className="notice compact"><Info size={15}/><span>Thresholds are configurable examples. Calibrate using representative, labelled validation data before deployment.</span></div>
        </Panel>
      </div>

      {/* Roadmap */}
      <Panel>
        <SectionHead title="Recommended AI implementation roadmap" sub="Build value incrementally and validate every stage."/>
        <div className="roadmap">
          {[
            {n:'01',title:'OCR + structured extraction',desc:'Python service with OCR, field schemas, confidence and page coordinates.',tag:'MVP'},
            {n:'02',title:'Deterministic cross-document checks',desc:'Compare entities, counts, dates and identifiers with explainable rules.',tag:'MVP'},
            {n:'03',title:'APH retrieval-augmented copilot',desc:'Approved source corpus, clause citations, version filters and abstention.',tag:'Phase 2'},
            {n:'04',title:'Duplicate & visual forensics',desc:'Hash index, metadata analysis, image tamper cues and human adjudication.',tag:'Phase 2'},
            {n:'05',title:'Graph-based case intelligence',desc:'Cross-case entity resolution with privacy, false-match review and audit.',tag:'Phase 3'}
          ].map((r,i)=>(
            <div className="roadmap-item" key={r.n}>
              <span className="roadmap-n">{r.n}</span>
              <div><b>{r.title}</b><p>{r.desc}</p></div>
              <Badge tone={i<2?'green':'gray'}>{r.tag}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  }

  const renderGraph = ()=> <div className="page-stack"><div className="notice"><Icon I={Info} size={18}/><div><b>Illustrative relationship graph</b><span>Connections below are synthetic demo links to show the interaction pattern. They are not allegations about real institutions.</span></div></div><div className="grid-two graph-layout"><Panel><SectionHead title="Case relationship map" sub="Select a node to inspect the example relationship."/><div className="graph-canvas"><svg viewBox="0 0 620 430" role="img" aria-label="Illustrative relationship network"><defs><filter id="glow"><feGaussianBlur stdDeviation="3.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g stroke="#d9dff0" strokeWidth="2" fill="none"><path d="M310 210 L150 105"/><path d="M310 210 L470 95"/><path d="M310 210 L485 310"/><path d="M310 210 L145 330"/><path d="M150 105 L75 215" strokeDasharray="5 5"/><path d="M470 95 L555 190" strokeDasharray="5 5"/><path d="M145 330 L250 385" strokeDasharray="5 5"/><path d="M485 310 L390 390" strokeDasharray="5 5"/></g>{[{x:310,y:210,r:52,t:'Northbridge',s:'Institution',k:'Northbridge Institute',c:'#656ef0'},{x:150,y:105,r:35,t:'Faculty list',s:'Document',k:'Faculty register',c:'#16a79a'},{x:470,y:95,r:35,t:'Safety cert',s:'Document',k:'Safety certificate',c:'#f59e4b'},{x:485,y:310,r:35,t:'Greenfield',s:'Institution',k:'Greenfield College',c:'#8b79e8'},{x:145,y:330,r:35,t:'Address',s:'Shared field',k:'Address match',c:'#6f9ce8'},{x:75,y:215,r:27,t:'Case 1048',s:'Case',k:'Case AUV-2026-1048',c:'#9ca8bd'},{x:555,y:190,r:27,t:'Case 1047',s:'Case',k:'Case AUV-2026-1047',c:'#9ca8bd'},{x:250,y:385,r:27,t:'Entity ID',s:'Identifier',k:'Registration identifier',c:'#9ca8bd'},{x:390,y:390,r:27,t:'Case link',s:'Possible link',k:'Potential shared evidence',c:'#9ca8bd'}].map(n=><g key={n.k} onClick={()=>setGraphFocus(n.k)} style={{cursor:'pointer'}}><circle cx={n.x} cy={n.y} r={n.r+4} fill={graphFocus===n.k?n.c:'transparent'} opacity=".12"/><circle cx={n.x} cy={n.y} r={n.r} fill={n.c} opacity={graphFocus===n.k?1:.9} stroke={graphFocus===n.k?'#29365a':'#fff'} strokeWidth={graphFocus===n.k?3:2}/><text x={n.x} y={n.y+4} fill="#fff" textAnchor="middle" fontSize={n.r>40?11:10} fontWeight="600">{n.t}</text><text x={n.x} y={n.y+n.r+17} fill="#7a8499" textAnchor="middle" fontSize="10">{n.s}</text></g>)}</svg><div className="graph-legend"><span><i style={{background:'#656ef0'}}/>Institution</span><span><i style={{background:'#16a79a'}}/>Document</span><span><i style={{background:'#9ca8bd'}}/>Possible link</span></div></div></Panel><Panel><SectionHead title="Node intelligence" sub="Selected relationship details"/><div className="node-detail"><div className="node-detail-icon"><Network size={24}/></div><Badge tone="purple">Synthetic link</Badge><h3>{graphFocus}</h3><p>This example node represents a potential relationship that a reviewer would need to validate against source records.</p><div className="node-meta"><span>Relationship basis</span><b>Illustrative shared field / file reference</b></div><div className="node-meta"><span>Confidence</span><b>Not scored in this demo</b></div><div className="node-meta"><span>Required next action</span><b>Inspect original source and confirm entity match</b></div><Button block onClick={()=>go('Investigation')}>Open investigation <ArrowRight size={15}/></Button></div></Panel></div></div>

  const renderRules = ()=> <div className="page-stack"><div className="notice"><Icon I={BookOpenCheck} size={18}/><div><b>Rule governance is not the same as policy approval</b><span>Demo rules are placeholders. Before production, each compliance rule must map to a verified APH clause, edition, effective date, applicability and approved interpretation.</span></div><button onClick={()=>go('AI review lab')}>AI policy roadmap <ArrowRight size={14}/></button></div><Panel><SectionHead title="Rule library" sub={`${rulesState.length} configurable checks · demo rule set`} action={<Button onClick={()=>notify('Rule creation form is planned for the next iteration.')}><Plus size={15}/> Add rule</Button>}/><div className="rules-toolbar"><div className="search-box"><Search size={16}/><input placeholder="Search rule ID or name…" onChange={e=>setSearch(e.target.value)}/></div><Badge tone="orange">Unverified source mapping</Badge></div><div className="rule-list">{rulesState.filter(r=>(r.name+' '+r.id+' '+r.group).toLowerCase().includes(search.toLowerCase())).map(r=><div className="rule-row" key={r.id}><div className="rule-icon"><BookOpenCheck size={19}/></div><div className="rule-main"><div className="rule-title"><b>{r.name}</b><Badge tone={r.severity==='High'?'red':r.severity==='Medium'?'orange':'blue'}>{r.severity}</Badge></div><p>{r.description}</p><div className="rule-meta"><span>{r.id}</span><span>{r.group}</span><span>{r.version}</span></div><small className="rule-source"><Info size={12}/>{r.source}</small></div><label className="toggle"><input type="checkbox" checked={r.enabled} onChange={()=>setRulesState(rs=>rs.map(x=>x.id===r.id?{...x,enabled:!x.enabled}:x))}/><span/></label></div>)}</div><div className="table-footer"><span>{rulesState.filter(r=>r.enabled).length} enabled rules</span><span>Changes affect this demo session only.</span></div></Panel><div className="grid-three"><MiniInfo icon={History} title="Version each rule" text="Record the handbook edition, effective dates and approver."/><MiniInfo icon={Link2} title="Link exact clauses" text="Store official source URI and clause ID with each rule."/><MiniInfo icon={UserCheck} title="Test before release" text="Run regression cases and have policy owners approve interpretations."/></div></div>

  const renderAnalytics = ()=> <div className="page-stack"><div className="metric-grid"><Metric title="Cases in sample set" value={cases.length} sub="Current browser state" icon={Building2} tone="blue"/><Metric title="Findings raised" value={findings.length} sub="Illustrative demo findings" icon={AlertTriangle} tone="orange"/><Metric title="Rules enabled" value={rulesState.filter(r=>r.enabled).length} sub="Demo rule studio" icon={BookOpenCheck} tone="purple"/><Metric title="Cases with reviewer flags" value={cases.filter(c=>c.findings>0).length} sub="Sample records" icon={UserCheck} tone="green"/></div><div className="grid-two"><Panel><SectionHead title="Finding distribution" sub="Illustrative category counts"/><div className="chart-area tall"><ResponsiveContainer width="100%" height="100%"><BarChart data={barData} margin={{top:12,right:10,left:-15,bottom:0}}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e8ecf4"/><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#929bb0',fontSize:10}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#929bb0',fontSize:10}}/><Tooltip/><Bar dataKey="flagged" fill="#747df1" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></Panel><Panel><SectionHead title="Risk distribution" sub="Sample application register"/><div className="risk-distribution">{[{label:'High priority',range:'70–100',n:cases.filter(c=>c.risk>=70).length,tone:'red'},{label:'Medium priority',range:'40–69',n:cases.filter(c=>c.risk>=40&&c.risk<70).length,tone:'orange'},{label:'Low priority',range:'0–39',n:cases.filter(c=>c.risk<40).length,tone:'green'}].map(x=><div className="risk-dist-row" key={x.label}><div><span className={`risk-dot ${x.tone}`}/><b>{x.label}</b><small>{x.range}</small></div><strong>{x.n}</strong><div className="risk-track"><i className={x.tone} style={{width:`${x.n/cases.length*100}%`}}/></div></div>)}</div><p className="chart-note"><Info size={13}/> Risk priority is illustrative and not a compliance verdict.</p></Panel></div><Panel><SectionHead title="Report center" sub="Export transparent demo artefacts."/><div className="report-grid"><ReportCard icon={FileText} title="Case review summary" desc="Selected case, findings, reasoning and recommended next steps." onClick={exportReport}/><ReportCard icon={Building2} title="Application register CSV" desc="Current case list with status, risk priority and finding counts." onClick={exportCSV}/><ReportCard icon={MessageSquareText} title="Clarification letter draft" desc="Generate a non-final clarification request for human review." onClick={downloadClarification}/></div></Panel></div>

  const renderAudit = ()=> <div className="page-stack"><div className="notice"><Icon I={LockKeyhole} size={18}/><div><b>Audit-ready design, demo-only implementation</b><span>This screen illustrates an audit event model. It is not a tamper-proof production audit log; browser state can be changed or lost.</span></div></div><Panel><SectionHead title="Activity log" sub="Illustrative user and system events" action={<Button variant="secondary" onClick={()=>downloadBlob(['timestamp,event,actor,case_id,details',...activity.map((a,i)=>`2026-10-28 ${a.time},"${a.title}","Demo system","${cases[i]?.id||''}","${a.sub}"`)].join('\n'),'aurexa-audit-demo.csv','text/csv')}><Download size={15}/> Export log</Button>}/><div className="audit-list">{activity.concat([{icon:Settings,color:'blue',title:'Rule configuration inspected',sub:'APH Rule Studio · no official rule changes',time:'Yesterday'},{icon:Fingerprint,color:'violet',title:'Integrity control model viewed',sub:'AI review lab · hash checks explained',time:'Yesterday'}]).map((a,i)=><div className="audit-row" key={i}><div className={`activity-icon ${a.color}`}><a.icon size={16}/></div><div className="audit-event"><b>{a.title}</b><span>{a.sub}</span></div><div className="audit-actor">Demo reviewer</div><div className="audit-time">{a.time}</div><Badge tone="gray">Demo</Badge></div>)}</div></Panel><div className="grid-two"><Panel><SectionHead title="Required production controls" sub="Security checklist"/><div className="check-list">{['Role-based access control (RBAC)','Server-side immutable audit events','Encryption at rest and in transit','Retention and deletion policies','Malware scanning and file type validation','Reviewer action attribution','Secrets management and API access scopes'].map(x=><div key={x}><span className="check-empty"><Check size={12}/></span>{x}<Badge tone="orange">Not implemented</Badge></div>)}</div></Panel><Panel><SectionHead title="Evidence chain requirements" sub="Proposed minimum metadata"/><div className="provenance-list">{[['Evidence ID','Stable unique identifier'],['SHA-256','File integrity fingerprint'],['Upload event','Actor, timestamp, source and consent'],['Extraction event','Model/version, confidence and output'],['Decision event','Reviewer, rationale and timestamp']].map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>)}</div></Panel></div></div>

  const renderSettings = ()=> <div className="page-stack"><Panel><SectionHead title="Workspace preferences" sub="Prototype settings affect only this browser session."/><div className="settings-list"><div><div className="settings-icon"><Sparkles size={19}/></div><div className="settings-copy"><b>Demo mode</b><p>Show sample data and clearly label simulated AI results.</p></div><label className="toggle"><input type="checkbox" checked={demoMode} onChange={e=>setDemoMode(e.target.checked)}/><span/></label></div><div><div className="settings-icon"><Shield size={19}/></div><div className="settings-copy"><b>Evidence-first review</b><p>Require source references and reviewer validation for consequential findings.</p></div><Badge tone="green">Recommended</Badge></div><div><div className="settings-icon"><Globe2 size={19}/></div><div className="settings-copy"><b>Official verification APIs</b><p>No DigiLocker, issuer, AICTE or institutional registry API is connected.</p></div><Badge tone="orange">Not connected</Badge></div><div><div className="settings-icon"><LockKeyhole size={19}/></div><div className="settings-copy"><b>Data storage</b><p>Current interactions are held in client-side React state and are not persistent.</p></div><Badge tone="blue">Browser session</Badge></div></div></Panel><Panel><SectionHead title="Review configuration" sub="Illustrative threshold settings"/><div className="threshold-control"><div><span>Low OCR confidence threshold</span><strong>{threshold}%</strong></div><input type="range" min="50" max="95" step="5" value={threshold} onChange={e=>setThreshold(Number(e.target.value))}/><div className="range-labels"><span>50%</span><span>95%</span></div><p className="chart-note"><Info size={13}/> This slider demonstrates configuration only; it is not connected to an OCR model.</p></div></Panel><Panel><SectionHead title="Prototype information" sub="Build and integration status"/><div className="integration-list">{[['React + Vite','Frontend framework','Ready'],['Spring Boot REST API','Case management & auth','Planned'],['Python OCR service','Document extraction','Planned'],['MySQL','Case and audit persistence','Planned'],['Object storage','Encrypted document storage','Planned'],['LLM + approved APH corpus','Grounded policy assistant','Planned']].map(([a,b,c])=><div key={a}><div><b>{a}</b><small>{b}</small></div><Badge tone={c==='Ready'?'green':'gray'}>{c}</Badge></div>)}</div></Panel></div>

  const content = {
    Overview:renderOverview, Applications:renderApplications, 'New verification':renderNewVerification,
    Investigation:renderInvestigation, 'AI review lab':renderAILab, 'Relationship graph':renderGraph,
    'APH rule studio':renderRules, 'Analytics & reports':renderAnalytics, 'Audit trail':renderAudit, Settings:renderSettings
  }
  const [mobileNav,setMobileNav] = useState(false)

  if (!isAuthenticated) {
    return renderLogin()
  }

  return <div className={`app-shell ${collapsed?'nav-collapsed':''} ${mobileNav?'mobile-nav-open':''}`}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><ShieldCheck size={23}/><span/></div><div className="brand-copy"><b>AUREXA<span>·</span></b><small>VERIFYAI</small></div><button className="collapse-btn" onClick={()=>setCollapsed(!collapsed)} title="Collapse sidebar"><PanelLeftClose size={16}/></button></div>
      <div className="workspace-select"><div className="workspace-avatar">AV</div><div><b>AICTE Review Workspace</b><small>Regulatory operations</small></div><ChevronDown size={14}/></div>
      <nav className="main-nav">{navGroups.map(g=><div className="nav-group" key={g.label}><div className="nav-label">{g.label}</div>{g.items.map(([name,I])=><button key={name} className={`nav-item ${page===name?'active':''}`} onClick={()=>{go(name);setMobileNav(false)}} title={name}><Icon I={I} size={18}/><span>{name}</span>{name==='Investigation'&&<i className="nav-count">{findings.filter(f=>f.state!=='Resolved').length}</i>}</button>)}</div>)}</nav>
      <div className="sidebar-bottom">
        <div className="security-card">
          <div className="security-icon"><ShieldCheck size={17}/></div>
          <div><b>Evidence-first AI</b><small>Human oversight enabled</small></div>
          <span className="status-light"/>
        </div>
        <button className="nav-item" onClick={()=>notify('Official Regulatory Scrutiny Protocol: Level 3 Active.')}><CircleHelp size={18}/><span>Help & guidance</span></button>
        <div className="profile">
          <div className={`profile-avatar ${currentUser.color}`}>{currentUser.initials}</div>
          <div style={{flex: 1, minWidth: 0, overflow: 'hidden'}}>
            <b style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block'}}>{currentUser.name}</b>
            <small style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block'}}>{currentUser.role}</small>
          </div>
          <button className="icon-btn" onClick={handleLogout} title="Sign out session">
            <LogOut size={16}/>
          </button>
        </div>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left">
          <button className="mobile-menu icon-btn" onClick={()=>setMobileNav(!mobileNav)}><Menu size={19}/></button>
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><b>{page}</b></div>
        </div>
        <div className="topbar-right">
          <div className="official-clearance-pill" title={currentUser.clearance}>
            <Shield size={12}/>
            <span>{currentUser.clearance.split('·')[0].trim()}</span>
          </div>
          <div className="environment"><span className="env-dot"/>{demoMode?'REGULATORY ENVIRONMENT':'SECURE SCRUTINY'}</div>
          <button className="top-search" onClick={()=>{go('Applications');document.querySelector('.search-box input')?.focus()}}><Search size={16}/><span>Search anything…</span><kbd>⌘ K</kbd></button>
          <button className="icon-btn notification-btn" onClick={()=>notify('You are all caught up in the regulatory workspace.')}><Bell size={18}/><i/></button>
          <div className={`top-avatar ${currentUser.color}`} title={`${currentUser.name} (${currentUser.role})`}>{currentUser.initials}</div>
          <button className="official-logout-btn" onClick={handleLogout} title="Sign out of official portal">
            <LogOut size={13}/>
            <span>Sign out</span>
          </button>
        </div>
      </header>
      <div className="page-content"><div className="page-heading"><div><div className="heading-kicker">AUREXA / {page.toUpperCase()}</div><h1>{pageDescriptions[page][0]}</h1><p>{pageDescriptions[page][1]}</p></div><div className="heading-date"><CalendarClock size={15}/> Wednesday, 28 October 2026</div></div>{content[page]()}</div>
      <footer className="app-footer"><span>© 2026 Aurexa-VerifyAI <i/> Verification intelligence, with accountability.</span><span><ShieldCheck size={13}/> Prototype · Class-3 Regulatory Scrutiny Portal</span></footer>
    </main>
    {mobileNav&&<div className="mobile-scrim" onClick={()=>setMobileNav(false)}/>}
    {toast&&<div className="toast"><CheckCircleIcon/><span>{toast}</span><button onClick={()=>setToast('')}><X size={15}/></button></div>}
  </div>
}
function Metric({title,value,delta,sub,icon:I,tone}){return <div className="metric-card"><div className="metric-top"><span>{title}</span><span className={`metric-icon ${tone}`}><I size={18}/></span></div><div className="metric-value">{value}</div><div className="metric-foot"><span className={delta==='Priority'?'priority-label':'metric-delta'}>{delta}</span><small>{sub}</small></div></div>}
function Risk({value}){const tone=value>=70?'high':value>=40?'medium':'low';return <div className="risk-cell"><div className={`risk-number ${tone}`}>{value}</div><div className="risk-track"><i className={tone} style={{width:`${value}%`}}/></div></div>}
function Status({value}){let tone='gray';if(value==='Needs review')tone='red';else if(value==='In analysis')tone='blue';else if(value==='Clarification sent')tone='orange';else if(value==='Ready for review')tone='purple';else if(value==='Approved by reviewer'||value==='Resolved')tone='green';else if(value==='Open')tone='orange';return <Badge tone={tone} dot>{value}</Badge>}
function MiniInfo({icon:I,title,text}){return <div className="mini-info"><div className="mini-info-icon"><I size={18}/></div><div><b>{title}</b><p>{text}</p></div></div>}
function AIFeature({icon:I,tag,title,desc,state,tone,active,onClick}){
  return <div className={`ai-feature ${active?'active':''}`} onClick={onClick}>
    {active&&<span className="ai-feature-active-indicator"><i/> Active in Sandbox</span>}
    <div className={`ai-feature-icon ${tone}`}><I size={20}/></div>
    <div className="ai-tag">{tag}</div>
    <h3>{title}</h3>
    <p>{desc}</p>
    <div className="ai-feature-bottom">
      <Badge tone={tone==='orange'?'orange':tone==='green'?'green':'blue'}>{state}</Badge>
      <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:9,fontWeight:700,color:active?'#686ff0':'#7a869e'}}>
        {active?'Testing in Lab ↓':'Try Live Demo →'}
      </span>
    </div>
  </div>
}
function ReportCard({icon:I,title,desc,onClick}){return <button className="report-card" onClick={onClick}><div className="report-icon"><I size={21}/></div><b>{title}</b><p>{desc}</p><span>Generate export <ArrowRight size={14}/></span></button>}
function CheckCircleIcon(){return <span className="check-circle-icon"><Check size={13}/></span>}
function FolderOpenIcon(){return <Upload size={15}/>}
function formatBytes(n){if(n<1024)return `${n} B`;if(n<1024*1024)return `${(n/1024).toFixed(1)} KB`;return `${(n/1024/1024).toFixed(1)} MB`}
