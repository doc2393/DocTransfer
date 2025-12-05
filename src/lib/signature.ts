// E-Signature Core Utilities
// Handles signature link generation, validation, workflow management, and certificate creation

import { supabase } from './supabase';

/**
 * Generate a unique secure signing link for a signer
 */
export const generateSigningLink = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Validate signature data format
 */
export const validateSignature = (signatureData: string, signatureType: 'drawn' | 'typed' | 'uploaded' | 'value'): boolean => {
    if (!signatureData || signatureData.trim() === '') {
        return false;
    }

    switch (signatureType) {
        case 'drawn':
        case 'uploaded':
            // Check if it's a valid base64 image
            return /^data:image\/(png|jpeg|jpg|svg\+xml);base64,/.test(signatureData);
        case 'typed':
        case 'value':
            // Check if it's a non-empty string
            return signatureData.length > 0;
        default:
            return false;
    }
};

/**
 * Check if a signer can sign based on workflow order
 */
export const checkSigningOrder = async (
    signerId: string,
    documentId: string
): Promise<{ allowed: boolean; message?: string }> => {
    try {
        // Get document workflow type
        const { data: document, error: docError } = await supabase
            .from('documents')
            .select('signature_workflow_type')
            .eq('id', documentId)
            .single();

        if (docError || !document) {
            return { allowed: false, message: 'Document not found' };
        }

        // If parallel workflow, anyone can sign anytime
        if (document.signature_workflow_type === 'parallel') {
            return { allowed: true };
        }

        // For sequential workflow, check order
        const { data: currentSigner, error: signerError } = await supabase
            .from('document_signers')
            .select('signing_order')
            .eq('id', signerId)
            .single();

        if (signerError || !currentSigner) {
            return { allowed: false, message: 'Signer not found' };
        }

        // Check if all previous signers have signed
        const { data: previousSigners, error: prevError } = await supabase
            .from('document_signers')
            .select('status')
            .eq('document_id', documentId)
            .lt('signing_order', currentSigner.signing_order);

        if (prevError) {
            return { allowed: false, message: 'Error checking signing order' };
        }

        // Check if any previous signer hasn't signed
        const unsignedPrevious = previousSigners?.some(s => s.status !== 'signed');

        if (unsignedPrevious) {
            return {
                allowed: false,
                message: 'Please wait for previous signers to complete their signatures'
            };
        }

        return { allowed: true };
    } catch (error) {
        console.error('Error checking signing order:', error);
        return { allowed: false, message: 'Error validating signing order' };
    }
};

/**
 * Create an audit log entry
 */
export const createAuditEntry = async (
    documentId: string,
    action: string,
    description?: string,
    signerId?: string,
    metadata?: Record<string, any>
): Promise<void> => {
    try {
        const entry = {
            document_id: documentId,
            signer_id: signerId || null,
            action,
            description,
            ip_address: await getClientIP(),
            user_agent: navigator.userAgent,
            metadata: metadata || null
        };

        await supabase
            .from('signature_audit_log')
            .insert(entry);
    } catch (error) {
        console.error('Error creating audit entry:', error);
    }
};

/**
 * Get client IP address (using a public API)
 */
const getClientIP = async (): Promise<string> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'unknown';
    } catch (error) {
        return 'unknown';
    }
};

/**
 * Generate signature completion certificate
 */
export const generateSignatureCertificate = async (
    documentId: string
): Promise<{ success: boolean; certificateData?: any; error?: string }> => {
    try {
        // Fetch document details
        const { data: document, error: docError } = await supabase
            .from('documents')
            .select('*')
            .eq('id', documentId)
            .single();

        if (docError || !document) {
            return { success: false, error: 'Document not found' };
        }

        // Fetch all signers
        const { data: signers, error: signersError } = await supabase
            .from('document_signers')
            .select('*')
            .eq('document_id', documentId)
            .order('signing_order');

        if (signersError) {
            return { success: false, error: 'Failed to fetch signers' };
        }

        // Fetch audit trail
        const { data: auditLog, error: auditError } = await supabase
            .from('signature_audit_log')
            .select('*')
            .eq('document_id', documentId)
            .order('created_at');

        if (auditError) {
            return { success: false, error: 'Failed to fetch audit log' };
        }

        // Create certificate data structure
        const certificateData = {
            documentName: document.name,
            documentId: document.id,
            completedAt: document.signature_completed_at,
            workflowType: document.signature_workflow_type,
            signers: signers?.map(signer => ({
                name: signer.signer_name,
                email: signer.signer_email,
                signedAt: signer.signed_at,
                ipAddress: signer.ip_address,
                order: signer.signing_order
            })),
            auditTrail: auditLog?.map(log => ({
                action: log.action,
                description: log.description,
                timestamp: log.created_at,
                ipAddress: log.ip_address
            })),
            generatedAt: new Date().toISOString(),
            legalStatement: 'This certificate confirms that all parties have executed this document with electronic signatures, which are legally binding under the Electronic Signatures in Global and National Commerce Act (E-Sign Act) and the Uniform Electronic Transactions Act (UETA).'
        };

        return { success: true, certificateData };
    } catch (error) {
        console.error('Error generating certificate:', error);
        return { success: false, error: 'Failed to generate certificate' };
    }
};

/**
 * Check if all signatures are complete for a document
 */
export const checkAllSignaturesComplete = async (documentId: string): Promise<boolean> => {
    try {
        const { data: signers, error } = await supabase
            .from('document_signers')
            .select('status')
            .eq('document_id', documentId);

        if (error || !signers) {
            return false;
        }

        return signers.every(signer => signer.status === 'signed');
    } catch (error) {
        console.error('Error checking signature completion:', error);
        return false;
    }
};

/**
 * Get next signer in sequential workflow
 */
export const getNextSigner = async (documentId: string): Promise<any | null> => {
    try {
        const { data: nextSigner, error } = await supabase
            .from('document_signers')
            .select('*')
            .eq('document_id', documentId)
            .eq('status', 'pending')
            .order('signing_order')
            .limit(1)
            .single();

        if (error) {
            return null;
        }

        return nextSigner;
    } catch (error) {
        console.error('Error getting next signer:', error);
        return null;
    }
};

/**
 * Update signer status
 */
export const updateSignerStatus = async (
    signerId: string,
    status: 'pending' | 'viewed' | 'signed' | 'declined',
    additionalData?: Record<string, any>
): Promise<boolean> => {
    try {
        const updateData: any = {
            status,
            ...additionalData
        };

        if (status === 'viewed' && !additionalData?.viewed_at) {
            updateData.viewed_at = new Date().toISOString();
        }

        if (status === 'signed' && !additionalData?.signed_at) {
            updateData.signed_at = new Date().toISOString();
            updateData.ip_address = await getClientIP();
            updateData.user_agent = navigator.userAgent;
        }

        const { error } = await supabase
            .from('document_signers')
            .update(updateData)
            .eq('id', signerId);

        return !error;
    } catch (error) {
        console.error('Error updating signer status:', error);
        return false;
    }
};

/**
 * Save signature record
 */
export const saveSignatureRecord = async (
    fieldId: string,
    signerId: string,
    signatureData: string,
    signatureType: 'drawn' | 'typed' | 'uploaded' | 'value'
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('signature_records')
            .insert({
                signature_field_id: fieldId,
                signer_id: signerId,
                signature_data: signatureData,
                signature_type: signatureType,
                ip_address: await getClientIP(),
                user_agent: navigator.userAgent
            });

        return !error;
    } catch (error) {
        console.error('Error saving signature record:', error);
        return false;
    }
};

/**
 * Get signature fields for a document and signer
 */
export const getSignatureFields = async (
    documentId: string,
    signerId?: string
): Promise<any[]> => {
    try {
        let query = supabase
            .from('signature_fields')
            .select('*')
            .eq('document_id', documentId);

        if (signerId) {
            query = query.eq('assigned_signer_id', signerId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching signature fields:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching signature fields:', error);
        return [];
    }
};

/**
 * Delete signature field
 */
export const deleteSignatureField = async (fieldId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('signature_fields')
            .delete()
            .eq('id', fieldId);

        return !error;
    } catch (error) {
        console.error('Error deleting signature field:', error);
        return false;
    }
};
