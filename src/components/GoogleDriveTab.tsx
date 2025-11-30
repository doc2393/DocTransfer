import React, { useState } from 'react';
import {
    Link as LinkIcon,
    Lock,
    Calendar,
    Download,
    Copy,
    Check,
    Mail,
    ExternalLink,
    AlertCircle,
    CheckCircle,
    Info,
} from 'lucide-react';
import { isValidGoogleDriveLink, getFileTypeFromUrl } from '../lib/google-drive-utils';
import { supabase } from '../lib/supabase';

interface GoogleDriveTabProps {
    onDocumentUploaded?: () => void;
}

const GoogleDriveTab: React.FC<GoogleDriveTabProps> = ({ onDocumentUploaded }) => {
    const [googleDriveLink, setGoogleDriveLink] = useState('');
    const [fileName, setFileName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);

    // Settings
    const [passwordProtection, setPasswordProtection] = useState(false);
    const [linkExpiration, setLinkExpiration] = useState(false);
    const [allowDownloads, setAllowDownloads] = useState(true);
    const [emailVerification, setEmailVerification] = useState(false);
    const [password, setPassword] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [allowedEmail, setAllowedEmail] = useState('');

    const handleLinkChange = (value: string) => {
        setGoogleDriveLink(value);
        setError(null);
        setGeneratedLink(null);

        // Auto-detect file name from common patterns
        if (value) {
            const fileType = getFileTypeFromUrl(value);
            if (!fileName && fileType !== 'Google Drive') {
                setFileName(`Shared ${fileType}`);
            }
        }
    };

    const handleGenerateLink = async () => {
        setError(null);

        // Validation
        if (!googleDriveLink.trim()) {
            setError('Please enter a Google Drive link');
            return;
        }

        if (!isValidGoogleDriveLink(googleDriveLink)) {
            setError('Invalid Google Drive link. Please enter a valid share link from Google Drive.');
            return;
        }

        if (!fileName.trim()) {
            setError('Please enter a file name');
            return;
        }

        if (passwordProtection && !password.trim()) {
            setError('Please enter a password');
            return;
        }

        if (linkExpiration && !expiresAt) {
            setError('Please select an expiration date');
            return;
        }

        setIsGenerating(true);

        try {
            // Generate unique share link ID
            const shareLink = Math.random().toString(36).substring(2, 12);

            // Save to database
            const { error: dbError } = await supabase
                .from('documents')
                .insert({
                    name: fileName,
                    file_path: '', // Not used for Google Drive links
                    file_size: 0, // Unknown for external links
                    file_type: getFileTypeFromUrl(googleDriveLink),
                    storage_type: 'google_drive',
                    google_drive_link: googleDriveLink,
                    share_link: shareLink,
                    allow_download: allowDownloads,
                    password: passwordProtection ? password : null,
                    expires_at: linkExpiration ? expiresAt : null,
                    email_verification: emailVerification,
                    allowed_email: emailVerification && allowedEmail ? allowedEmail : null,
                });

            if (dbError) throw dbError;

            // Generate DocTransfer link
            const docTransferLink = `${window.location.origin}/view/${shareLink}`;
            setGeneratedLink(docTransferLink);

            // Notify parent component
            if (onDocumentUploaded) {
                onDocumentUploaded();
            }

            // Reset form
            setGoogleDriveLink('');
            setFileName('');
        } catch (error: any) {
            console.error('Error generating link:', error);
            setError(error.message || 'Failed to generate secure link');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyLink = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

    const resetForm = () => {
        setGeneratedLink(null);
        setPasswordProtection(false);
        setLinkExpiration(false);
        setEmailVerification(false);
        setPassword('');
        setExpiresAt('');
        setAllowedEmail('');
    };

    return (
        <div className="google-drive-wrapper" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'start' }}>
            {/* Left Column: Link Input & Settings */}
            <div className="content-card" style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6' }}>
                <div className="card-header" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <LinkIcon size={24} style={{ color: '#4285f4' }} /> Google Drive Link Wrapper
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Upto 2TB file Transfer using Google Drive share link.</p>
                </div>

                {/* Instructions */}
                <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Info size={20} style={{ color: '#0284c7', flexShrink: 0 }} />
                        <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0c4a6e' }}>How to use:</h3>
                    </div>
                    <ol style={{ margin: '0 0 0 1.75rem', padding: 0, color: '#0369a1', fontSize: '0.875rem', lineHeight: '1.6' }}>
                        <li>Upload your file to Google Drive</li>
                        <li>Right-click and select "Get link" or "Share"</li>
                        <li>Set permissions to "Anyone with the link"</li>
                        <li>Copy the share link</li>
                        <li>Paste it below and configure security settings</li>
                    </ol>
                </div>

                {/* Google Drive Link Input */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        Google Drive Share Link *
                    </label>
                    <input
                        type="text"
                        placeholder="https://drive.google.com/file/d/..."
                        value={googleDriveLink}
                        onChange={(e) => handleLinkChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: error && !googleDriveLink ? '1px solid #ef4444' : '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                        }}
                    />
                    {googleDriveLink && isValidGoogleDriveLink(googleDriveLink) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: '#16a34a', fontSize: '0.875rem' }}>
                            <CheckCircle size={16} />
                            <span>Valid Google Drive link detected</span>
                        </div>
                    )}
                </div>

                {/* File Name Input */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                        File Name *
                    </label>
                    <input
                        type="text"
                        placeholder="Enter a descriptive name for this file"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            outline: 'none',
                        }}
                    />
                </div>

                {error && (
                    <div style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Security Settings */}
                <div className="settings-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '-0.5rem' }}>Security Settings</h3>

                    <div className="setting-item" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div className="setting-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Lock size={20} style={{ color: '#6b7280' }} />
                                <div>
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
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="setting-item" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div className="setting-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <Calendar size={20} style={{ color: '#6b7280' }} />
                                <div>
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
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', color: '#1f2937' }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="setting-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="setting-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Download size={20} style={{ color: '#6b7280' }} />
                            <div>
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
                            <Mail size={20} style={{ color: '#6b7280' }} />
                            <div>
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
                                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                            />
                        </div>
                    )}
                </div>

                <button
                    onClick={handleGenerateLink}
                    disabled={isGenerating}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '1rem',
                        background: isGenerating ? '#9ca3af' : '#4285f4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '600',
                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '1rem',
                    }}
                >
                    {isGenerating ? 'Generating...' : (
                        <>
                            <LinkIcon size={20} />
                            Generate Secure Link
                        </>
                    )}
                </button>
            </div>

            {/* Right Column: Generated Link */}
            <div className="content-card" style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="card-header" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <LinkIcon size={24} style={{ color: '#3b82f6' }} /> Your Secure Link
                    </h2>
                    <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Share this link with recipients</p>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2rem', minHeight: '400px' }}>
                    {generatedLink ? (
                        <>
                            <div style={{ width: '120px', height: '120px', background: '#dcfce7', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                                <CheckCircle size={64} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#15803d' }}>Link Generated!</h3>
                                <p style={{ color: '#6b7280' }}>Your secure link is ready to share</p>
                            </div>

                            <div className="link-box" style={{ width: '100%', padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <LinkIcon size={20} style={{ color: '#9ca3af', flexShrink: 0 }} />
                                <input
                                    type="text"
                                    value={generatedLink}
                                    readOnly
                                    style={{ fontSize: '0.875rem', flex: 1, border: 'none', background: 'transparent', outline: 'none' }}
                                />
                                <button
                                    onClick={copyLink}
                                    style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                >
                                    {copiedLink ? <Check size={20} color="#16a34a" /> : <Copy size={20} color="#6b7280" />}
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                                <button
                                    onClick={() => window.open(generatedLink, '_blank')}
                                    style={{ flex: 1, padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <ExternalLink size={16} />
                                    Test Link
                                </button>
                                <button
                                    onClick={resetForm}
                                    style={{ flex: 1, padding: '0.75rem', background: '#4285f4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Create Another
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                            <LinkIcon style={{ width: '64px', height: '64px', marginBottom: '1.5rem', color: '#e5e7eb', margin: '0 auto 1.5rem' }} />
                            <p style={{ maxWidth: '300px', margin: '0 auto' }}>Enter a Google Drive link and click "Generate Secure Link" to create a shareable link</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GoogleDriveTab;
