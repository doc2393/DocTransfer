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
    PenTool,
    UserPlus
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { encryptFile } from './lib/crypto';
import { hashPassword } from './lib/security';
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

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadedDoc, setUploadedDoc] = useState<Document | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Settings State
    const [passwordProtection, setPasswordProtection] = useState(false);
    const [linkExpiration, setLinkExpiration] = useState(false);
    const [allowDownloads, setAllowDownloads] = useState(true);
    const [password, setPassword] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [screenshotProtection, setScreenshotProtection] = useState(false);
    const [emailVerification, setEmailVerification] = useState(false);
    const [allowedEmail, setAllowedEmail] = useState('');
    const [applyWatermark, setApplyWatermark] = useState(false);
    const [requestSignature, setRequestSignature] = useState(false);

    // Create preview URL when file is selected
    useEffect(() => {
        if (selectedFile) {
            const objectUrl = URL.createObjectURL(selectedFile);
            setFilePreview(objectUrl);

            // Cleanup function to revoke object URL
            return () => {
                URL.revokeObjectURL(objectUrl);
            };
        } else {
            setFilePreview(null);
        }
    }, [selectedFile]);

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

    const handleFileSelection = (file: File) => {
        setSelectedFile(file);
        setUploadedDoc(null);
        setUploadError(null);
        setFilePreview(null); // Will be set by useEffect
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            // 1. Encrypt file before upload
            const { encryptedBlob, key, iv } = await encryptFile(selectedFile);

            // 2. Upload encrypted file to Supabase Storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, encryptedBlob);

            if (uploadError) throw uploadError;

            // 3. Create public URL (for the encrypted file)
            // Note: This URL will serve the encrypted content. The client must decrypt it.
            // const { data: { publicUrl } } = supabase.storage
            //    .from('documents')
            //    .getPublicUrl(filePath);

            const shareLink = Math.random().toString(36).substring(2, 12);

            // 4. Save document metadata to database with encryption details
            const { data: docData, error: dbError } = await supabase
                .from('documents')
                .insert({
                    name: selectedFile.name,
                    file_path: filePath,
                    file_size: selectedFile.size,
                    file_type: selectedFile.type,
                    share_link: shareLink,
                    allow_download: allowDownloads,
                    password: passwordProtection ? await hashPassword(password) : null,
                    expires_at: linkExpiration ? expiresAt : null,
                    custom_domain: null,
                    screenshot_protection: screenshotProtection,
                    email_verification: emailVerification,
                    allowed_email: emailVerification ? allowedEmail : null,
                    // Encryption metadata
                    encryption_key: key,
                    encryption_iv: iv,
                    is_encrypted: true,
                    original_file_name: selectedFile.name,
                    original_file_type: selectedFile.type
                })
                .select()
                .single();

            if (dbError) throw dbError;

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
                    expiresAt: linkExpiration ? expiresAt : '',
                    allowDownload: allowDownloads,
                    customDomain: ''
                }
            };

            setDocuments(prev => [newDoc, ...prev]);
            setUploadedDoc(newDoc);
            setSelectedFile(null);

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

    const handlePreview = async () => {
        if (!uploadedDoc) return;

        try {
            // Get public URL from Supabase storage
            const { data } = supabase.storage
                .from('documents')
                .getPublicUrl(uploadedDoc.file_path);

            if (data?.publicUrl) {
                setPreviewUrl(data.publicUrl);
                setShowPreviewModal(true);
            }
        } catch (error) {
            console.error('Error loading preview:', error);
        }
    };

    return (
        <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
            {/* Header */}
            <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1.5rem 2rem' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#4f46e5', marginBottom: '0.5rem' }}>DocTransfer Dashboard</h1>
                            <p style={{ fontSize: '0.95rem', color: '#6b7280' }}>Welcome back! Here's what's happening.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button style={{ padding: '0.625rem 1.25rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#374151', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <UserPlus size={18} />
                                Team
                            </button>
                            <button style={{ padding: '0.625rem 1.25rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <Upload size={18} />
                                Upload Document
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                        {/* Total Documents */}
                        <div style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)', borderRadius: '16px', padding: '1.5rem', border: '1px solid #dce4ff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FileText size={24} color="white" />
                                </div>
                                <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <TrendingUp size={16} /> 12%
                                </span>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.25rem' }}>{documents.length}</div>
                            <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: '500' }}>Total Documents</div>
                        </div>

                        {/* Total Views */}
                        <div style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)', borderRadius: '16px', padding: '1.5rem', border: '1px solid #f3e8ff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Eye size={24} color="white" />
                                </div>
                                <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <TrendingUp size={16} /> 24%
                                </span>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.25rem' }}>1,247</div>
                            <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: '500' }}>Total Views</div>
                        </div>

                        {/* Unique Viewers */}
                        <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)', borderRadius: '16px', padding: '1.5rem', border: '1px solid #dbeafe' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={24} color="white" />
                                </div>
                                <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <TrendingUp size={16} /> 18%
                                </span>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.25rem' }}>623</div>
                            <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: '500' }}>Unique Viewers</div>
                        </div>

                        {/* Avg. View Time */}
                        <div style={{ background: 'linear-gradient(135deg, #fef3f8 0%, #fce7f3 100%)', borderRadius: '16px', padding: '1.5rem', border: '1px solid #fce7f3' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BarChart2 size={24} color="white" />
                                </div>
                                <span style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <TrendingDown size={16} /> 5%
                                </span>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.25rem' }}>5m 42s</div>
                            <div style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: '500' }}>Avg. View Time</div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', background: '#f3f4f6', padding: '0.5rem', borderRadius: '12px', width: 'fit-content' }}>
                        <button onClick={() => setActiveTab('upload')} style={{ padding: '0.625rem 1.5rem', background: activeTab === 'upload' ? '#8b5cf6' : 'transparent', color: activeTab === 'upload' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <Upload size={16} /> Upload
                        </button>
                        <button onClick={() => setActiveTab('google-drive')} style={{ padding: '0.625rem 1.5rem', background: activeTab === 'google-drive' ? '#8b5cf6' : 'transparent', color: activeTab === 'google-drive' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <Globe size={16} /> Google Drive
                        </button>
                        <button onClick={() => setActiveTab('documents')} style={{ padding: '0.625rem 1.5rem', background: activeTab === 'documents' ? '#8b5cf6' : 'transparent', color: activeTab === 'documents' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <FileText size={16} /> Documents
                        </button>
                        <button onClick={() => setActiveTab('analytics')} style={{ padding: '0.625rem 1.5rem', background: activeTab === 'analytics' ? '#8b5cf6' : 'transparent', color: activeTab === 'analytics' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <BarChart2 size={16} /> Analytics
                        </button>
                        <button onClick={() => setActiveTab('settings')} style={{ padding: '0.625rem 1.5rem', background: activeTab === 'settings' ? '#8b5cf6' : 'transparent', color: activeTab === 'settings' ? 'white' : '#6b7280', border: 'none', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <Shield size={16} /> Share Settings
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                {activeTab === 'google-drive' ? (
                    <GoogleDriveTab onDocumentUploaded={fetchDocuments} />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Upload Document Section */}
                        <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <Upload size={24} style={{ color: '#4f46e5' }} />
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>Upload Document</h2>
                            </div>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Upload any document to generate a secure sharing link</p>

                            {/* Error Display */}
                            {uploadError && (
                                <div style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                    <Shield size={18} />
                                    <span>{uploadError}</span>
                                </div>
                            )}

                            {/* Upload Area */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('file-upload')?.click()}
                                style={{
                                    padding: '3rem 2rem',
                                    border: isDragging ? '2px dashed #4f46e5' : selectedFile ? '2px dashed #10b981' : '2px dashed #e5e7eb',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    marginBottom: '1.5rem',
                                    background: isDragging ? '#f0f4ff' : selectedFile ? '#f0fdf4' : '#fafbfc',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {/* Icon with checkmark when file selected */}
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '0 auto 1rem',
                                    background: selectedFile ? '#dcfce7' : '#f3f4f6',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {selectedFile ? (
                                        <Check size={40} color="#10b981" strokeWidth={3} />
                                    ) : (
                                        <FileText size={36} color="#6b7280" />
                                    )}
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: selectedFile ? '#047857' : '#374151' }}>
                                    {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: selectedFile ? '#10b981' : '#9ca3af', fontWeight: selectedFile ? '500' : '400' }}>
                                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB • Ready to upload` : 'Supports documents, images, videos, presentations, and more'}
                                </p>
                                {!selectedFile && (
                                    <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>Maximum file size: 30 MB</p>
                                )}
                                <input
                                    type="file"
                                    onChange={handleFileInput}
                                    id="file-upload"
                                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                    disabled={isUploading}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Settings */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                {/* Password Protection */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Lock size={18} style={{ color: '#6b7280' }} />
                                            <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#374151' }}>Password Protection</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" checked={passwordProtection} onChange={(e) => setPasswordProtection(e.target.checked)} />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    {passwordProtection && (
                                        <input
                                            type="password"
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={{
                                                padding: '0.625rem 0.875rem',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                fontSize: '0.875rem',
                                                outline: 'none',
                                                marginLeft: '2rem'
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Link Expiration */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Calendar size={18} style={{ color: '#6b7280' }} />
                                            <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#374151' }}>Link Expiration</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" checked={linkExpiration} onChange={(e) => setLinkExpiration(e.target.checked)} />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    {linkExpiration && (
                                        <input
                                            type="date"
                                            value={expiresAt}
                                            onChange={(e) => setExpiresAt(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            style={{
                                                padding: '0.625rem 0.875rem',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                fontSize: '0.875rem',
                                                outline: 'none',
                                                marginLeft: '2rem',
                                                color: '#374151'
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Allow Downloads */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Download size={18} style={{ color: '#6b7280' }} />
                                        <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#374151' }}>Allow Downloads</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={allowDownloads} onChange={(e) => setAllowDownloads(e.target.checked)} />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                {/* Screenshot Protection */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Shield size={18} style={{ color: '#6b7280' }} />
                                        <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#374151' }}>Screenshot Protection</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={screenshotProtection} onChange={(e) => setScreenshotProtection(e.target.checked)} />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                {/* Email Verification */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Mail size={18} style={{ color: '#6b7280' }} />
                                            <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#374151' }}>Require Email Verification</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" checked={emailVerification} onChange={(e) => setEmailVerification(e.target.checked)} />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    {emailVerification && (
                                        <input
                                            type="email"
                                            placeholder="Enter recipient email (optional)"
                                            value={allowedEmail}
                                            onChange={(e) => setAllowedEmail(e.target.value)}
                                            style={{
                                                padding: '0.625rem 0.875rem',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                fontSize: '0.875rem',
                                                outline: 'none',
                                                marginLeft: '2rem'
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Watermark */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <ImageIcon size={18} style={{ color: '#6b7280' }} />
                                        <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#374151' }}>Apply Watermark</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={applyWatermark} onChange={(e) => setApplyWatermark(e.target.checked)} />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                {/* E-Signature */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <PenTool size={18} style={{ color: '#6b7280' }} />
                                        <span style={{ fontSize: '0.95rem', fontWeight: '500', color: '#374151' }}>Request E-Signature</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input type="checkbox" checked={requestSignature} onChange={(e) => setRequestSignature(e.target.checked)} />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>

                            {/* Upload Button */}
                            <button
                                onClick={handleUpload}
                                disabled={!selectedFile || isUploading}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    background: !selectedFile || isUploading ? '#9ca3af' : '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    fontSize: '0.95rem',
                                    cursor: !selectedFile || isUploading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {isUploading ? 'Generating Link...' : (
                                    <>
                                        <LinkIcon size={18} />
                                        Generate Secure Link
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Sharing Link Section */}
                        <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <LinkIcon size={24} style={{ color: '#3b82f6' }} />
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>Sharing Link</h2>
                            </div>
                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>Your secure, trackable document link</p>

                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', minHeight: '400px' }}>
                                {uploadedDoc ? (
                                    <>
                                        <div style={{ width: '100px', height: '100px', background: '#e0e7ff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <LinkIcon size={48} color="#4f46e5" />
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem', color: '#111827' }}>{uploadedDoc.name}</h3>
                                            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{uploadedDoc.size} • Ready to share</p>
                                        </div>
                                        <div style={{ width: '100%', padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <input
                                                type="text"
                                                value={uploadedDoc.link}
                                                readOnly
                                                style={{ fontSize: '0.875rem', flex: 1, border: 'none', background: 'transparent', outline: 'none', color: '#6b7280' }}
                                            />
                                            <button
                                                onClick={() => copyLink(uploadedDoc.link)}
                                                style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                {copiedId === 'link' ? <Check size={18} color="#16a34a" /> : <Copy size={18} color="#6b7280" />}
                                            </button>
                                        </div>

                                        {/* Preview Button */}
                                        <button
                                            onClick={handlePreview}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: '#f9fafb',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '10px',
                                                color: '#374151',
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#f9fafb'}
                                        >
                                            <Eye size={18} />
                                            Preview Document
                                        </button>
                                    </>
                                ) : selectedFile && filePreview ? (
                                    <>
                                        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem', color: '#111827' }}>File Preview</h3>
                                            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{selectedFile.name} • {(selectedFile.size / 1024).toFixed(2)} KB</p>
                                        </div>

                                        {/* Preview Container */}
                                        <div style={{ width: '100%', maxHeight: '350px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {selectedFile.type.startsWith('image/') ? (
                                                <img
                                                    src={filePreview}
                                                    alt="Preview"
                                                    style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }}
                                                />
                                            ) : selectedFile.type === 'application/pdf' ? (
                                                <iframe
                                                    src={filePreview}
                                                    style={{ width: '100%', height: '300px', border: 'none', borderRadius: '8px' }}
                                                    title="PDF Preview"
                                                />
                                            ) : selectedFile.type === 'text/plain' ? (
                                                <iframe
                                                    src={filePreview}
                                                    style={{ width: '100%', height: '300px', border: 'none', borderRadius: '8px', background: 'white' }}
                                                    title="Text Preview"
                                                />
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                                    <FileText size={64} color="#9ca3af" style={{ marginBottom: '1rem' }} />
                                                    <p style={{ fontSize: '0.875rem' }}>Preview not available for this file type</p>
                                                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#9ca3af' }}>{selectedFile.type || 'Unknown type'}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ width: '100%', textAlign: 'center' }}>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                                Click "Generate Secure Link" to upload and create a shareable link
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                        <LinkIcon size={64} style={{ marginBottom: '1rem', color: '#e5e7eb' }} />
                                        <p style={{ maxWidth: '300px', margin: '0 auto' }}>Upload a document and click "Generate Secure Link" to create a shareable link</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Preview Modal */}
            {showPreviewModal && uploadedDoc && previewUrl && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.85)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem'
                    }}
                    onClick={() => setShowPreviewModal(false)}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '16px',
                            maxWidth: '1200px',
                            width: '100%',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
                                    {uploadedDoc.name}
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                    {uploadedDoc.size} • {uploadedDoc.type}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    background: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#6b7280',
                                    fontSize: '1.5rem'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: '1.5rem',
                            background: '#f9fafb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {uploadedDoc.type.startsWith('image/') ? (
                                <img
                                    src={previewUrl}
                                    alt={uploadedDoc.name}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        borderRadius: '8px'
                                    }}
                                />
                            ) : uploadedDoc.type === 'application/pdf' ? (
                                <iframe
                                    src={previewUrl}
                                    style={{
                                        width: '100%',
                                        height: '600px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: 'white'
                                    }}
                                    title="PDF Preview"
                                />
                            ) : uploadedDoc.type === 'text/plain' ? (
                                <iframe
                                    src={previewUrl}
                                    style={{
                                        width: '100%',
                                        height: '600px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: 'white',
                                        padding: '1rem'
                                    }}
                                    title="Text Preview"
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    <FileText size={80} color="#9ca3af" style={{ marginBottom: '1.5rem' }} />
                                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                                        Preview not available
                                    </h4>
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        This file type cannot be previewed in the browser
                                    </p>
                                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#9ca3af' }}>
                                        {uploadedDoc.type || 'Unknown type'}
                                    </p>
                                    <a
                                        href={uploadedDoc.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-block',
                                            marginTop: '1.5rem',
                                            padding: '0.75rem 1.5rem',
                                            background: '#4f46e5',
                                            color: 'white',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            fontWeight: '600',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        Open in New Tab
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataRoom;
