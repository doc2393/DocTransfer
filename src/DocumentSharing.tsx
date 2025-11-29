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
    ArrowLeft,
    Trash2,
    Settings,
    File as FileIcon,
    X,
    Shield,
    Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './lib/supabase';

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
        screenshotProtection: boolean;
        emailVerification: boolean;
        allowedEmail?: string;
    };
}

const DocumentSharing: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);

    // Feature Toggles
    const [passwordProtection, setPasswordProtection] = useState(false);
    const [linkExpiration, setLinkExpiration] = useState(false);
    const [customDomain, setCustomDomain] = useState(false);
    const [allowDownloads, setAllowDownloads] = useState(true);
    const [password, setPassword] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [screenshotProtection, setScreenshotProtection] = useState(false);
    const [emailVerification, setEmailVerification] = useState(false);
    const [allowedEmail, setAllowedEmail] = useState('');

    // Fetch documents
    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        const { data } = await supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false });

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
                    customDomain: doc.custom_domain || '',
                    screenshotProtection: doc.screenshot_protection || false,
                    emailVerification: doc.email_verification || false,
                    allowedEmail: doc.allowed_email || ''
                }
            }));
            setDocuments(formattedDocs);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) setUploadedFile(files[0]);
    };

    const handleUpload = async () => {
        if (!uploadedFile) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            const fileExt = uploadedFile.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, uploadedFile);

            if (uploadError) throw uploadError;

            const shareLink = Math.random().toString(36).substring(2, 12);

            const { error: dbError } = await supabase
                .from('documents')
                .insert({
                    name: uploadedFile.name,
                    file_path: filePath,
                    file_size: uploadedFile.size,
                    file_type: uploadedFile.type,
                    share_link: shareLink,
                    allow_download: allowDownloads,
                    password: passwordProtection ? password : null,
                    expires_at: linkExpiration ? expiresAt : null,
                    custom_domain: customDomain ? 'docs.company.com' : null,
                    screenshot_protection: screenshotProtection,
                    email_verification: emailVerification,
                    allowed_email: emailVerification && allowedEmail ? allowedEmail : null
                })
                .select()
                .single();

            if (dbError) throw dbError;

            const fullLink = `${window.location.origin}/view/${shareLink}`;
            setGeneratedLink(fullLink);

            // Refresh list
            fetchDocuments();
            setUploadedFile(null); // Reset upload

        } catch (error: any) {
            console.error('Upload error:', error);
            setUploadError(error.message);
        }
        setIsUploading(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const deleteDoc = async (id: string) => {
        if (!confirm('Delete this document?')) return;
        const doc = documents.find(d => d.id === id);
        if (!doc) return;

        await supabase.storage.from('documents').remove([doc.file_path]);
        await supabase.from('documents').delete().eq('id', id);
        setDocuments(documents.filter(d => d.id !== id));
    };

    return (
        <div className="data-room" style={{ background: '#f8fafc', minHeight: '100vh' }}>
            <header style={{ padding: '1.5rem 2rem', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/dataroom" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', fontWeight: '500' }}>
                        <ArrowLeft size={20} /> Back to Dashboard
                    </Link>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>Document Sharing</h1>
                </div>
            </header>

            <div className="sharing-container">
                {/* Document Sharing Card */}
                <div className="sharing-card">
                    <div className="card-title">
                        <h2>Document Sharing</h2>
                        <p>Securely upload, manage, and share your documents with advanced control.</p>
                    </div>

                    {/* Upload Zone */}
                    <div
                        className={`upload-zone-animated ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        {uploadedFile ? (
                            <div style={{ textAlign: 'center' }}>
                                <div className="upload-illustration" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                    <Check size={48} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#16a34a', marginBottom: '0.5rem' }}>{uploadedFile.name}</h3>
                                <p style={{ color: '#64748b' }}>{(uploadedFile.size / 1024).toFixed(2)} KB • Ready to upload</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                                    style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
                                >
                                    Change File
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="upload-illustration">
                                    <Upload size={48} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>Drag & Drop or Click to Upload</h3>
                                <p style={{ color: '#64748b' }}>PDF, DOCX, PNG, JPG (Unlimited Size)</p>
                            </>
                        )}
                        <input
                            type="file"
                            id="file-upload"
                            style={{ display: 'none' }}
                            onChange={(e) => e.target.files && setUploadedFile(e.target.files[0])}
                        />
                    </div>

                    {/* Features Grid */}
                    <div className="feature-grid">
                        {/* Password Protection */}
                        <div className="feature-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div className="feature-header">
                                <div className="feature-icon-box" style={{ background: '#ef4444' }}>
                                    <Lock size={20} />
                                </div>
                                <div className="feature-content">
                                    <h4>Password Protection</h4>
                                    <p>Secure link with password</p>
                                </div>
                                <label className="toggle-switch" style={{ marginLeft: 'auto' }}>
                                    <input type="checkbox" checked={passwordProtection} onChange={(e) => setPasswordProtection(e.target.checked)} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            {passwordProtection && (
                                <div style={{ marginTop: '1rem', paddingLeft: '3.5rem' }}>
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

                        {/* Link Expiration */}
                        <div className="feature-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div className="feature-header">
                                <div className="feature-icon-box" style={{ background: '#f59e0b' }}>
                                    <Calendar size={20} />
                                </div>
                                <div className="feature-content">
                                    <h4>Link Expiration</h4>
                                    <p>Set temporary access</p>
                                </div>
                                <label className="toggle-switch" style={{ marginLeft: 'auto' }}>
                                    <input type="checkbox" checked={linkExpiration} onChange={(e) => setLinkExpiration(e.target.checked)} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            {linkExpiration && (
                                <div style={{ marginTop: '1rem', paddingLeft: '3.5rem' }}>
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

                        {/* Custom Domain */}
                        <div className="feature-item">
                            <div className="feature-header">
                                <div className="feature-icon-box" style={{ background: '#3b82f6' }}>
                                    <Globe size={20} />
                                </div>
                                <div className="feature-content">
                                    <h4>Custom Branding</h4>
                                    <p>Use your own domain</p>
                                </div>
                                <label className="toggle-switch" style={{ marginLeft: 'auto' }}>
                                    <input type="checkbox" checked={customDomain} onChange={(e) => setCustomDomain(e.target.checked)} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        {/* Download Control */}
                        <div className="feature-item">
                            <div className="feature-header">
                                <div className="feature-icon-box" style={{ background: '#10b981' }}>
                                    <Download size={20} />
                                </div>
                                <div className="feature-content">
                                    <h4>Download Control</h4>
                                    <p>Allow file downloads</p>
                                </div>
                                <label className="toggle-switch" style={{ marginLeft: 'auto' }}>
                                    <input type="checkbox" checked={allowDownloads} onChange={(e) => setAllowDownloads(e.target.checked)} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        {/* Screenshot Protection */}
                        <div className="feature-item">
                            <div className="feature-header">
                                <div className="feature-icon-box" style={{ background: '#6366f1' }}>
                                    <Shield size={20} />
                                </div>
                                <div className="feature-content">
                                    <h4>Screenshot Protection</h4>
                                    <p>Prevent capture & copy</p>
                                </div>
                                <label className="toggle-switch" style={{ marginLeft: 'auto' }}>
                                    <input type="checkbox" checked={screenshotProtection} onChange={(e) => setScreenshotProtection(e.target.checked)} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        {/* Email Verification */}
                        <div className="feature-item">
                            <div className="feature-header">
                                <div className="feature-icon-box" style={{ background: '#ec4899' }}>
                                    <Mail size={20} />
                                </div>
                                <div className="feature-content">
                                    <h4>Require Email Verification</h4>
                                    <p>Verify recipient identity</p>
                                </div>
                                <label className="toggle-switch" style={{ marginLeft: 'auto' }}>
                                    <input type="checkbox" checked={emailVerification} onChange={(e) => setEmailVerification(e.target.checked)} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            {emailVerification && (
                                <div style={{ marginTop: '1rem', paddingLeft: '3.5rem' }}>
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
                        </div>
                    </div>

                    {/* Generate Button / Link Display */}
                    {generatedLink ? (
                        <div style={{ marginTop: '3rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: '#22c55e', padding: '0.5rem', borderRadius: '8px', color: 'white' }}>
                                <Check size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ color: '#15803d', marginBottom: '0.25rem' }}>Secure Link Generated!</h4>
                                <p style={{ color: '#16a34a', fontSize: '0.9rem', wordBreak: 'break-all' }}>{generatedLink}</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(generatedLink)}
                                className="btn-primary"
                                style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {copiedLink ? <Check size={18} /> : <Copy size={18} />}
                                {copiedLink ? 'Copied' : 'Copy'}
                            </button>
                            <button onClick={() => setGeneratedLink(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <button
                            className="btn-generate"
                            onClick={handleUpload}
                            disabled={!uploadedFile || isUploading}
                            style={{ opacity: !uploadedFile || isUploading ? 0.7 : 1, cursor: !uploadedFile || isUploading ? 'not-allowed' : 'pointer' }}
                        >
                            {isUploading ? 'Generating Link...' : (
                                <>
                                    <LinkIcon size={24} />
                                    Generate Secure Link
                                </>
                            )}
                        </button>
                    )}

                    {uploadError && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', textAlign: 'center' }}>
                            {uploadError}
                        </div>
                    )}
                </div>

                {/* Unlimited Documents Section */}
                <div style={{ marginTop: '4rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1e293b', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText className="text-indigo-500" />
                        Your Documents ({documents.length})
                    </h2>

                    <div className="documents-grid-premium">
                        {documents.map(doc => (
                            <div key={doc.id} className="doc-card-premium">
                                <div className="doc-card-header">
                                    <div className="doc-type-icon doc-type-default">
                                        <FileIcon />
                                    </div>
                                    <div className="doc-meta">
                                        <h3>{doc.name}</h3>
                                        <span>{doc.size} • {doc.uploadedAt}</span>
                                    </div>
                                </div>
                                <div className="link-box">
                                    <LinkIcon size={16} className="text-gray-400" />
                                    <input type="text" value={doc.link} readOnly className="link-url" />
                                    <button onClick={() => copyToClipboard(doc.link)} className="btn-copy">
                                        <Copy size={16} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-settings" style={{ flex: 1 }}>
                                        <Settings size={16} /> Settings
                                    </button>
                                    <button onClick={() => deleteDoc(doc.id)} className="btn-trash">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentSharing;
