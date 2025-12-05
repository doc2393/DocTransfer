import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, Check, Type } from 'lucide-react';

interface SignatureCanvasComponentProps {
    onSave: (signatureData: string, type: 'drawn' | 'typed') => void;
    onClose: () => void;
    title?: string;
    isInitials?: boolean;
}

const SignatureCanvasComponent: React.FC<SignatureCanvasComponentProps> = ({
    onSave,
    onClose,
    title = 'Add Your Signature',
    isInitials = false
}) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
    const [typedSignature, setTypedSignature] = useState('');
    const [selectedFont, setSelectedFont] = useState('Brush Script MT');

    const fonts = [
        'Brush Script MT',
        'Lucida Handwriting',
        'Segoe Script',
        'Freestyle Script',
        'Monotype Corsiva'
    ];

    const clearCanvas = () => {
        sigCanvas.current?.clear();
    };

    const handleSaveDrawn = () => {
        if (sigCanvas.current?.isEmpty()) {
            alert('Please provide a signature first');
            return;
        }

        const signatureData = sigCanvas.current?.toDataURL('image/png');
        if (signatureData) {
            onSave(signatureData, 'drawn');
        }
    };

    const handleSaveTyped = () => {
        if (!typedSignature.trim()) {
            alert('Please type your signature');
            return;
        }

        // Create canvas to render typed signature
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'black';
            ctx.font = `48px "${selectedFont}", cursive`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

            const signatureData = canvas.toDataURL('image/png');
            onSave(signatureData, 'typed');
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '1rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '2rem',
                    maxWidth: '600px',
                    width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '8px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} color="#6b7280" />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#f3f4f6', padding: '0.5rem', borderRadius: '10px' }}>
                    <button
                        onClick={() => setActiveTab('draw')}
                        style={{
                            flex: 1,
                            padding: '0.625rem',
                            background: activeTab === 'draw' ? '#4f46e5' : 'transparent',
                            color: activeTab === 'draw' ? 'white' : '#6b7280',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Draw
                    </button>
                    <button
                        onClick={() => setActiveTab('type')}
                        style={{
                            flex: 1,
                            padding: '0.625rem',
                            background: activeTab === 'type' ? '#4f46e5' : 'transparent',
                            color: activeTab === 'type' ? 'white' : '#6b7280',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Type size={18} />
                        Type
                    </button>
                </div>

                {/* Draw Tab */}
                {activeTab === 'draw' && (
                    <div>
                        <div
                            style={{
                                border: '2px dashed #d1d5db',
                                borderRadius: '12px',
                                background: '#f9fafb',
                                marginBottom: '1rem',
                                overflow: 'hidden'
                            }}
                        >
                            <SignatureCanvas
                                ref={sigCanvas}
                                canvasProps={{
                                    width: 532,
                                    height: 200,
                                    style: {
                                        width: '100%',
                                        height: '200px',
                                        cursor: 'crosshair'
                                    }
                                }}
                                backgroundColor="#f9fafb"
                                penColor="#000000"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={clearCanvas}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <RotateCcw size={18} />
                                Clear
                            </button>
                            <button
                                onClick={handleSaveDrawn}
                                style={{
                                    flex: 2,
                                    padding: '0.75rem',
                                    background: '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Check size={18} />
                                Save Signature
                            </button>
                        </div>
                    </div>
                )}

                {/* Type Tab */}
                {activeTab === 'type' && (
                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                                Type your {isInitials ? 'initials' : 'full name'}
                            </label>
                            <input
                                type="text"
                                value={typedSignature}
                                onChange={(e) => setTypedSignature(e.target.value)}
                                placeholder={isInitials ? 'e.g., JS' : 'e.g., John Smith'}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                                autoFocus
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                                Choose a font
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {fonts.map((font) => (
                                    <button
                                        key={font}
                                        onClick={() => setSelectedFont(font)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            background: selectedFont === font ? '#e0e7ff' : '#f9fafb',
                                            border: selectedFont === font ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            fontFamily: `"${font}", cursive`,
                                            fontSize: '1.25rem',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {typedSignature || (isInitials ? 'Your Initials' : 'Your Name')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleSaveTyped}
                            disabled={!typedSignature.trim()}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                background: !typedSignature.trim() ? '#9ca3af' : '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: '600',
                                cursor: !typedSignature.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Check size={18} />
                            Save Signature
                        </button>
                    </div>
                )}

                <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
                    By clicking "Save Signature", you consent to sign this document electronically
                </p>
            </div>
        </div>
    );
};

export default SignatureCanvasComponent;
