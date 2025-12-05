import React, { useState } from 'react';
import { UserPlus, Mail, User, ArrowUpDown, Trash2 } from 'lucide-react';

export interface Signer {
    id: string;
    name: string;
    email: string;
    order: number;
    color: string;
    signingLink?: string;
}

interface SignerManagementProps {
    signers: Signer[];
    onSignersChange: (signers: Signer[]) => void;
    workflowType: 'sequential' | 'parallel';
    maxSigners?: number;
}

const SIGNER_COLORS = [
    '#4f46e5', // Indigo
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#6366f1'  // Blue
];

const SignerManagement: React.FC<SignerManagementProps> = ({
    signers,
    onSignersChange,
    workflowType,
    maxSigners = 10
}) => {
    const [newSignerName, setNewSignerName] = useState('');
    const [newSignerEmail, setNewSignerEmail] = useState('');

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const addSigner = () => {
        if (!newSignerName.trim() || !newSignerEmail.trim()) {
            alert('Please enter both name and email');
            return;
        }

        if (!isValidEmail(newSignerEmail)) {
            alert('Please enter a valid email address');
            return;
        }

        if (signers.length >= maxSigners) {
            alert(`Maximum ${maxSigners} signers allowed`);
            return;
        }

        const newSigner: Signer = {
            id: Math.random().toString(36).substring(2, 15),
            name: newSignerName.trim(),
            email: newSignerEmail.trim().toLowerCase(),
            order: signers.length + 1,
            color: SIGNER_COLORS[signers.length % SIGNER_COLORS.length]
        };

        onSignersChange([...signers, newSigner]);
        setNewSignerName('');
        setNewSignerEmail('');
    };

    const removeSigner = (id: string) => {
        const updatedSigners = signers
            .filter(s => s.id !== id)
            .map((s, index) => ({ ...s, order: index + 1 }));
        onSignersChange(updatedSigners);
    };

    const moveSignerUp = (index: number) => {
        if (index === 0) return;
        const newSigners = [...signers];
        [newSigners[index], newSigners[index - 1]] = [newSigners[index - 1], newSigners[index]];
        const reorderedSigners = newSigners.map((s, i) => ({ ...s, order: i + 1 }));
        onSignersChange(reorderedSigners);
    };

    const moveSignerDown = (index: number) => {
        if (index === signers.length - 1) return;
        const newSigners = [...signers];
        [newSigners[index], newSigners[index + 1]] = [newSigners[index + 1], newSigners[index]];
        const reorderedSigners = newSigners.map((s, i) => ({ ...s, order: i + 1 }));
        onSignersChange(reorderedSigners);
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
                    Signers ({signers.length}/{maxSigners})
                </h3>

                {/* Add Signer Form */}
                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                                Full Name
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input
                                    type="text"
                                    value={newSignerName}
                                    onChange={(e) => setNewSignerName(e.target.value)}
                                    placeholder="John Smith"
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 0.75rem 0.625rem 2.25rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem',
                                        outline: 'none'
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && addSigner()}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>
                                Email Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                <input
                                    type="email"
                                    value={newSignerEmail}
                                    onChange={(e) => setNewSignerEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 0.75rem 0.625rem 2.25rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem',
                                        outline: 'none'
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && addSigner()}
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={addSigner}
                        disabled={signers.length >= maxSigners}
                        style={{
                            width: '100%',
                            padding: '0.625rem',
                            background: signers.length >= maxSigners ? '#9ca3af' : '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            cursor: signers.length >= maxSigners ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <UserPlus size={16} />
                        Add Signer
                    </button>
                </div>

                {/* Signers List */}
                {signers.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {signers.map((signer, index) => (
                            <div
                                key={signer.id}
                                style={{
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}
                            >
                                {/* Color Badge */}
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        background: signer.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: '700',
                                        fontSize: '1rem',
                                        flexShrink: 0
                                    }}
                                >
                                    {workflowType === 'sequential' ? signer.order : signer.name.charAt(0).toUpperCase()}
                                </div>

                                {/* Signer Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.9rem', marginBottom: '0.125rem' }}>
                                        {signer.name}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {signer.email}
                                    </div>
                                    {workflowType === 'sequential' && (
                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                            Signing order: {signer.order}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                    {/* Order Controls (only for sequential) */}
                                    {workflowType === 'sequential' && signers.length > 1 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <button
                                                onClick={() => moveSignerUp(index)}
                                                disabled={index === 0}
                                                style={{
                                                    padding: '0.25rem',
                                                    background: index === 0 ? '#f3f4f6' : 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '4px',
                                                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                title="Move up"
                                            >
                                                <ArrowUpDown size={14} color={index === 0 ? '#d1d5db' : '#6b7280'} style={{ transform: 'rotate(180deg)' }} />
                                            </button>
                                            <button
                                                onClick={() => moveSignerDown(index)}
                                                disabled={index === signers.length - 1}
                                                style={{
                                                    padding: '0.25rem',
                                                    background: index === signers.length - 1 ? '#f3f4f6' : 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '4px',
                                                    cursor: index === signers.length - 1 ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                title="Move down"
                                            >
                                                <ArrowUpDown size={14} color={index === signers.length - 1 ? '#d1d5db' : '#6b7280'} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeSigner(signer.id)}
                                        style={{
                                            padding: '0.5rem',
                                            background: '#fee2e2',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title="Remove signer"
                                    >
                                        <Trash2 size={16} color="#dc2626" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {signers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                        <UserPlus size={48} style={{ margin: '0 auto 0.75rem', color: '#d1d5db' }} />
                        <p>No signers added yet</p>
                        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>Add signers using the form above</p>
                    </div>
                )}
            </div>

            {/* Workflow Type Info */}
            {signers.length > 1 && (
                <div style={{
                    background: workflowType === 'sequential' ? '#fef3c7' : '#dbeafe',
                    border: `1px solid ${workflowType === 'sequential' ? '#fcd34d' : '#93c5fd'}`,
                    borderRadius: '10px',
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                    color: '#374151'
                }}>
                    <strong>{workflowType === 'sequential' ? 'Sequential Signing:' : 'Parallel Signing:'}</strong>
                    {' '}
                    {workflowType === 'sequential'
                        ? 'Signers will sign in the order specified above.'
                        : 'All signers can sign simultaneously in any order.'}
                </div>
            )}
        </div>
    );
};

export default SignerManagement;
