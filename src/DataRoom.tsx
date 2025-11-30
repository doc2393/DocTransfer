import React, { useState, useEffect } from 'react';
import {
    Upload,
    FileText,
    Link as LinkIcon,
    Lock,
    Calendar,
    Download,
    Globe,
    Copy,
    Check,
    Eye,
    Users,
    BarChart2,
    TrendingUp,
    TrendingDown,
    Shield,
    Mail,
    Image as ImageIcon,
    PenTool
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import GoogleDriveTab from './components/GoogleDriveTab';

interface Document {
    id: string;
    name: string;
    size: string;
    type: string;
    uploadedAt: string;
    link: string;
    file_path: string;
    settings: {
        password: string;
        expiresAt: string;
        allowDownload: boolean;
        customDomain: string;
    };
}

const DataRoom: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [activeTab, setActiveTab] = useState<'upload' | 'google-drive' | 'documents' | 'analytics' | 'settings'>('upload');

    // New State for 2-step process
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadedDoc, setUploadedDoc] = useState<Document | null>(null);

    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // Settings State
    const [passwordProtection, setPasswordProtection] = useState(false);
    const [linkExpiration, setLinkExpiration] = useState(false);
    const [allowDownloads, setAllowDownloads] = useState(true);
    const [screenshotProtection, setScreenshotProtection] = useState(false);
    const [emailVerification, setEmailVerification] = useState(false);
    const [allowedEmail, setAllowedEmail] = useState('');
    const [applyWatermark, setApplyWatermark] = useState(false);
    const [requestSignature, setRequestSignature] = useState(false);
    const [password, setPassword] = useState('');
    const [expiresAt, setExpiresAt] = useState('');

    // Fetch documents on component mount
    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const formattedDocs: Document[] = data.map(doc => ({
                    id: doc.id,
                    name: doc.name,
                    size: (doc.file_size / 1024).toFixed(2) + ' KB',
                    type: doc.file_type,
                    uploadedAt: new Date(doc.created_at).toLocaleDateString(),
                    link: `${window.location.origin}/view/${doc.share_link}`,
                    file_path: doc.file_path,
                    settings: {
                        password: doc.password || '',
                        expiresAt: doc.expires_at || '',
                        allowDownload: doc.allow_download,
                        customDomain: doc.custom_domain || ''
                    }
                }));
                setDocuments(formattedDocs);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) handleFileSelection(files[0]);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    };

    // Step 1: Select File
    const handleFileSelection = (file: File) => {
        setSelectedFile(file);
        setUploadedDoc(null); // Reset previous upload
        setUploadError(null);
    };

    // Step 2: Upload & Generate Link
    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            // Generate unique filename
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            // Upload file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            // Generate share link
            const shareLink = Math.random().toString(36).substring(2, 12);

            // Save metadata to database
            const { data: docData, error: dbError } = await supabase
                .from('documents')
                .insert({
                    name: selectedFile.name,
                    file_path: filePath,
                    file_size: selectedFile.size,
                    file_type: selectedFile.type,
                    share_link: shareLink,
                    allow_download: allowDownloads,
                    password: passwordProtection ? password : null,
                    expires_at: linkExpiration ? expiresAt : null,
                    screenshot_protection: screenshotProtection,
                    email_verification: emailVerification,
                    allowed_email: emailVerification && allowedEmail ? allowedEmail : null
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // Add to local state
            const newDoc: Document = {
                id: docData.id,
                name: selectedFile.name,
                size: (selectedFile.size / 1024).toFixed(2) + ' KB',
                type: selectedFile.type,
                uploadedAt: new Date().toLocaleDateString(),
                link: `${window.location.origin}/view/${shareLink}`,
                file_path: filePath,
                settings: {
                    password: passwordProtection ? 'protected' : '',
                    expiresAt: '',
                    allowDownload: allowDownloads,
                    customDomain: ''
                }
            };

            setDocuments(prev => [newDoc, ...prev]);
            setUploadedDoc(newDoc);
            setSelectedFile(null); // Clear selection after successful upload

        } catch (error: any) {
            console.error('Upload error:', error);
            setUploadError(error.message || 'Upload failed');
        }

        setIsUploading(false);
    };

    const copyLink = (link: string) => {
        navigator.clipboard.writeText(link);
        setCopiedId('link');
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="data-room" style={{ background: '#f9fafb', minHeight: '100vh', paddingBottom: '4rem' }}>
            <header className="data-room-header" style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem', color: '#111827' }}>
                <div className="header-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
                    <div className="header-title" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#4f46e5' }}>DocTransfer Dashboard</h1>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Welcome back! Here's what's happening.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', textDecoration: 'none' }}>
                            <Users size={18} />
                            Team
                        </Link>
                        <button className="btn-primary" onClick={() => document.getElementById('file-upload')?.click()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            <Upload size={18} />
                            Upload Document
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                {/* Stats Grid */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="stat-card" style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div className="stat-icon" style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={24} />
                            </div>
                            <span className="stat-trend trend-up" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                <TrendingUp size={16} /> 12%
                            </span>
                        </div>
                        <div className="stat-value" style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.25rem' }}>{documents.length}</div>
                        <div className="stat-label" style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Total Documents</div>
                    </div>

                    <div className="stat-card" style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div className="stat-icon" style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f3e8ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Eye size={24} />
                            </div>
                            <span className="stat-trend trend-up" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                <TrendingUp size={16} /> 24%
                            </span>
                        </div>
                        <div className="stat-value" style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.25rem' }}>1,247</div>
                        <div className="stat-label" style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Total Views</div>
                    </div>

                    <div className="stat-card" style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div className="stat-icon" style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={24} />
                            </div>
                            <span className="stat-trend trend-up" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                <TrendingUp size={16} /> 18%
                            </span>
                        </div>
                        <div className="stat-value" style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.25rem' }}>623</div>
                        <div className="stat-label" style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Unique Viewers</div>
                    </div>

                    <div className="stat-card" style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div className="stat-icon" style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fce7f3', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BarChart2 size={24} />
                            </div>
                            <span className="stat-trend trend-down" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}>
                                <TrendingDown size={16} /> 5%
                            </span>
                        </div>
                        <div className="stat-value" style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.25rem' }}>5m 42s</div>
                        <div className="stat-label" style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: '500' }}>Avg. View Time</div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="nav-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'white', padding: '0.5rem', borderRadius: '12px', width: 'fit-content', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <button
                        onClick={() => setActiveTab('upload')}
                        style={{ padding: '0.5rem 1.5rem', background: activeTab === 'upload' ? '#8b5cf6' : 'transparent', color: activeTab === 'upload' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                        <Upload size={16} /> Upload
                    </button>
                    <button
                        onClick={() => setActiveTab('google-drive')}
                        style={{ padding: '0.5rem 1.5rem', background: activeTab === 'google-drive' ? '#4285f4' : 'transparent', color: activeTab === 'google-drive' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                        <Globe size={16} /> Google Drive
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        style={{ padding: '0.5rem 1.5rem', background: activeTab === 'documents' ? '#8b5cf6' : 'transparent', color: activeTab === 'documents' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                        <FileText size={16} /> Documents
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        style={{ padding: '0.5rem 1.5rem', background: activeTab === 'analytics' ? '#8b5cf6' : 'transparent', color: activeTab === 'analytics' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                        <BarChart2 size={16} /> Analytics
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{ padding: '0.5rem 1.5rem', background: activeTab === 'settings' ? '#8b5cf6' : 'transparent', color: activeTab === 'settings' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    >
                        <Shield size={16} /> Share Settings
                    </button>
                </div>

                {/* Main Content - Tab Based */}
                {activeTab === 'google-drive' ? (
                    <GoogleDriveTab onDocumentUploaded={fetchDocuments} />
                ) : (
                    <div className="dashboard-main" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'start' }}>
                        {/* Left Column: Upload & Settings */}
                        <div className="content-card" style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                            <div className="card-header" style={{ marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Upload size={24} className="text-indigo-500" style={{ color: '#4f46e5' }} /> Upload Document
                                </h2>
                                <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Upload any document to generate a secure sharing link</p>
                            </div>

                            <div
                                className={`upload-area-premium ${isDragging ? 'dragging' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('file-upload')?.click()}
                                style={{
                                    padding: '3rem 2rem',
                                    marginBottom: '2rem',
                                    border: '2px dashed #e0e7ff',
                                    borderRadius: '16px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    background: selectedFile ? '#f0fdf4' : 'transparent',
                                    borderColor: selectedFile ? '#86efac' : '#e0e7ff'
                                }}
                            >
                                {selectedFile ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <div className="upload-icon-wrapper" style={{ width: '64px', height: '64px', margin: '0 auto 1rem', background: '#dcfce7', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                                            <Check size={32} />
                                        </div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#15803d' }}>{selectedFile.name}</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#16a34a' }}>{(selectedFile.size / 1024).toFixed(2)} KB • Ready to upload</p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#15803d', cursor: 'pointer', fontSize: '0.9rem' }}
                                        >
                                            Change File
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="upload-icon-wrapper" style={{ width: '64px', height: '64px', margin: '0 auto 1rem', background: '#e0e7ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                            <FileText size={32} />
                                        </div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1f2937' }}>Click to upload or drag and drop</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Supports documents, images, videos, presentations, and more</p>
                                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>Maximum file size: 30 MB</p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    onChange={handleFileInput}
                                    className="file-input"
                                    id="file-upload"
                                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                    disabled={isUploading}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {uploadError && (
                                <div style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Shield size={20} />
                                    <span>{uploadError}</span>
                                </div>
                            )}

                            <div className="settings-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="setting-item" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <div className="setting-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <Lock size={20} className="setting-icon" style={{ color: '#6b7280' }} />
                                            <div className="setting-text">
                                                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>Password Protection</h4>
                                            </div>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" checked={passwordProtection} onChange={(e) => setPasswordProtection(e.target.checked)} />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    {passwordProtection && (
                                        <div style={{ paddingLeft: '3.25rem', width: '100%' }}>
                                            <input
                                                type="text"
                                                placeholder="Enter password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem 0.75rem',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="setting-item" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <div className="setting-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <Calendar size={20} className="setting-icon" style={{ color: '#6b7280' }} />
                                            <div className="setting-text">
                                                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>Link Expiration</h4>
                                            </div>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" checked={linkExpiration} onChange={(e) => setLinkExpiration(e.target.checked)} />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    {linkExpiration && (
                                        <div style={{ paddingLeft: '3.25rem', width: '100%' }}>
                                            <input
                                                type="date"
                                                value={expiresAt}
                                                onChange={(e) => setExpiresAt(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem 0.75rem',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    fontSize: '0.9rem',
                                                    outline: 'none',
                                                    color: '#1f2937'
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="setting-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <Download size={20} className="setting-icon" style={{ color: '#6b7280' }} />
                                        <div className="setting-text">
                                            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>Allow Downloads</h4>
                                        </div>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={allowDownloads} onChange={(e) => setAllowDownloads(e.target.checked)} />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="setting-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <Shield size={20} className="setting-icon" style={{ color: '#6b7280' }} />
                                        <div className="setting-text">
                                            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>Screenshot Protection</h4>
                                        </div>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={screenshotProtection} onChange={(e) => setScreenshotProtection(e.target.checked)} />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="setting-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <Mail size={20} className="setting-icon" style={{ color: '#6b7280' }} />
                                        <div className="setting-text">
                                            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>Require Email Verification</h4>
                                        </div>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={emailVerification} onChange={(e) => setEmailVerification(e.target.checked)} />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                                {emailVerification && (
                                    <div style={{ paddingLeft: '3.25rem', width: '100%' }}>
                                        <input
                                            type="email"
                                            placeholder="Enter recipient email (optional)"
                                            value={allowedEmail}
                                            onChange={(e) => setAllowedEmail(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem 0.75rem',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '0.9rem',
                                                outline: 'none'
                                            }}
                                        />
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                                            If set, only this email can access the file.
                                        </p>
                                    </div>
                                )}

                                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="setting-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <ImageIcon size={20} className="setting-icon" style={{ color: '#6b7280' }} />
                                        <div className="setting-text">
                                            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>Apply Watermark</h4>
                                        </div>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={applyWatermark} onChange={(e) => setApplyWatermark(e.target.checked)} />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div className="setting-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <PenTool size={20} className="setting-icon" style={{ color: '#6b7280' }} />
                                        <div className="setting-text">
                                            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>Request E-Signature</h4>
                                        </div>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={requestSignature} onChange={(e) => setRequestSignature(e.target.checked)} />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>

                            <button
                                className="btn-primary"
                                onClick={handleUpload}
                                disabled={!selectedFile || isUploading}
                                style={{
                                    width: '100%',
                                    marginTop: '2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '1rem',
                                    background: !selectedFile || isUploading ? '#9ca3af' : '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: !selectedFile || isUploading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {isUploading ? 'Generating Link...' : (
                                    <>
                                        <LinkIcon size={20} />
                                        Generate Secure Link
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Right Column: Sharing & Preview */}
                        <div className="content-card" style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div className="card-header" style={{ marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <LinkIcon size={24} className="text-blue-500" style={{ color: '#3b82f6' }} /> Sharing Link
                                </h2>
                                <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Your secure, trackable document link</p>
                            </div>

                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2rem', minHeight: '400px' }}>
                                {uploadedDoc ? (
                                    <>
                                        <div style={{ width: '120px', height: '120px', background: '#e0e7ff', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                                            <FileText size={64} />
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>{uploadedDoc.name}</h3>
                                            <p style={{ color: '#6b7280' }}>{uploadedDoc.size} • Ready to share</p>
                                        </div>

                                        <div className="link-box" style={{ width: '100%', padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <LinkIcon size={20} className="text-gray-400" />
                                            <input
                                                type="text"
                                                value={uploadedDoc.link}
                                                readOnly
                                                className="link-url"
                                                style={{ fontSize: '1rem', flex: 1, border: 'none', background: 'transparent', outline: 'none' }}
                                            />
                                            <button
                                                onClick={() => copyLink(uploadedDoc.link)}
                                                className={`btn-copy ${copiedId === 'link' ? 'copied' : ''}`}
                                                style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                {copiedId === 'link' ? <Check size={20} color="#16a34a" /> : <Copy size={20} color="#6b7280" />}
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                            <button className="btn-secondary" style={{ flex: 1, padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer' }}>Preview</button>
                                            <button className="btn-primary" style={{ flex: 1, padding: '0.75rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Send via Email</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="empty-state" style={{ textAlign: 'center', color: '#9ca3af' }}>
                                        <LinkIcon className="empty-icon" style={{ width: '64px', height: '64px', marginBottom: '1.5rem', color: '#e5e7eb' }} />
                                        <p style={{ maxWidth: '300px', margin: '0 auto' }}>Upload a document and click "Generate Secure Link" to create a shareable link</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataRoom;
