import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '../lib/supabase';
import { Upload, Globe, Layout, Palette, Save, Loader2, CheckCircle, AlertCircle, FileText, Download, Shield, Lock, ExternalLink, Smartphone, Monitor, Zap } from 'lucide-react';

interface BrandingSettingsProps {
    userId: string;
}

interface BrandingConfig {
    subdomain: string;
    site_url: string;
    logo_url: string;
    brand_color: string;
    theme_mode: 'light' | 'dark' | 'auto';
}

const PRESET_THEMES = [
    { name: 'Indigo', color: '#4f46e5', gradient: 'from-indigo-500 to-purple-600' },
    { name: 'Ocean', color: '#0ea5e9', gradient: 'from-sky-400 to-blue-600' },
    { name: 'Royal', color: '#7c3aed', gradient: 'from-violet-500 to-fuchsia-600' },
    { name: 'Rose', color: '#e11d48', gradient: 'from-rose-500 to-pink-600' },
    { name: 'Emerald', color: '#10b981', gradient: 'from-emerald-400 to-teal-600' },
    { name: 'Amber', color: '#f59e0b', gradient: 'from-amber-400 to-orange-600' },
    { name: 'Slate', color: '#0f172a', gradient: 'from-slate-700 to-slate-900' },
];

const BrandingSettings: React.FC<BrandingSettingsProps> = ({ userId }) => {
    const { getToken } = useAuth();
    const [config, setConfig] = useState<BrandingConfig>({
        subdomain: '',
        site_url: '',
        logo_url: '',
        brand_color: '#4f46e5',
        theme_mode: 'light'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');

    useEffect(() => {
        if (userId) {
            fetchSettings();
        }
    }, [userId]);

    const fetchSettings = async () => {
        try {
            const token = await getToken({ template: 'supabase' });
            const supabase = createClerkSupabaseClient(token || '');

            const { data, error } = await supabase
                .from('branding_settings')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setConfig({
                    subdomain: data.subdomain || '',
                    site_url: data.site_url || '',
                    logo_url: data.logo_url || '',
                    brand_color: data.brand_color || '#4f46e5',
                    theme_mode: 'light' // Default since column might not exist
                });
                if (data.logo_url) setLogoPreview(data.logo_url);
            }
        } catch (error) {
            console.error('Error fetching branding settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Logo must be less than 2MB' });
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const token = await getToken({ template: 'supabase' });
            const supabase = createClerkSupabaseClient(token || '');
            let finalLogoUrl = config.logo_url;

            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `${userId}/logo.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('branding')
                    .upload(fileName, logoFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('branding')
                    .getPublicUrl(fileName);

                finalLogoUrl = publicUrl;
            }

            const { error } = await supabase
                .from('branding_settings')
                .upsert({
                    user_id: userId,
                    subdomain: config.subdomain || null,
                    site_url: config.site_url,
                    logo_url: finalLogoUrl,
                    brand_color: config.brand_color,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setConfig(prev => ({ ...prev, logo_url: finalLogoUrl }));
            setMessage({ type: 'success', text: 'Branding settings saved successfully!' });
            setLogoFile(null);

        } catch (error: any) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Palette size={24} className="text-indigo-600" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto animate-fade-in-up pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Settings */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-white p-8 relative overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-bl-full -z-10 opacity-50"></div>

                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Brand Customization</h2>
                                <p className="text-gray-500 text-lg">Design your secure viewer experience.</p>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                <button
                                    onClick={() => setPreviewDevice('desktop')}
                                    className={`p-2 rounded-lg transition-all ${previewDevice === 'desktop' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Monitor size={20} />
                                </button>
                                <button
                                    onClick={() => setPreviewDevice('mobile')}
                                    className={`p-2 rounded-lg transition-all ${previewDevice === 'mobile' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Smartphone size={20} />
                                </button>
                            </div>
                        </div>

                        {message && (
                            <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 animate-scale-in shadow-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {message.type === 'success' ? <CheckCircle size={24} className="shrink-0" /> : <AlertCircle size={24} className="shrink-0" />}
                                <span className="font-medium">{message.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-10">
                            {/* Theme Selection */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider">
                                    <Zap size={16} className="text-indigo-500" />
                                    Color Theme
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {PRESET_THEMES.map((theme) => (
                                        <button
                                            key={theme.name}
                                            type="button"
                                            onClick={() => setConfig({ ...config, brand_color: theme.color })}
                                            className={`group relative p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg ${config.brand_color === theme.color ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600 ring-offset-2' : 'border-gray-200 bg-white hover:border-indigo-200'}`}
                                        >
                                            <div className={`w-full h-12 rounded-xl bg-gradient-to-br ${theme.gradient} mb-3 shadow-sm group-hover:scale-105 transition-transform`}></div>
                                            <span className={`text-sm font-semibold ${config.brand_color === theme.color ? 'text-indigo-900' : 'text-gray-600'}`}>{theme.name}</span>
                                            {config.brand_color === theme.color && (
                                                <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                                                    <CheckCircle size={14} className="text-indigo-600" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                    <div className="relative group">
                                        <input
                                            type="color"
                                            value={config.brand_color}
                                            onChange={(e) => setConfig({ ...config, brand_color: e.target.value })}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className={`h-full p-4 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 transition-all group-hover:border-indigo-400 group-hover:bg-gray-50 ${!PRESET_THEMES.find(t => t.color === config.brand_color) ? 'ring-2 ring-indigo-600 ring-offset-2 border-indigo-600 bg-indigo-50/50' : ''}`}>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm" style={{ backgroundColor: config.brand_color }}>
                                                <Palette size={16} className="text-gray-600" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-500">Custom</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Logo Section */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider">
                                    <Layout size={16} className="text-indigo-500" />
                                    Company Logo
                                </label>
                                <div className="p-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-all group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none"></div>
                                    <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
                                        <div className="w-32 h-32 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center overflow-hidden relative shrink-0 group-hover:scale-105 transition-transform duration-500">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-4" />
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="mx-auto text-gray-300 mb-2" size={32} />
                                                    <span className="text-xs text-gray-400">No Logo</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-3">
                                                <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md active:scale-95">
                                                    <Upload size={18} className="text-indigo-500" />
                                                    Upload New Logo
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                                                </label>
                                                {logoPreview && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setLogoFile(null);
                                                            setLogoPreview(null);
                                                            setConfig(prev => ({ ...prev, logo_url: '' }));
                                                        }}
                                                        className="text-sm text-red-500 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                                                    >
                                                        Remove Logo
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                Upload your company logo to display on the secure viewer.
                                                <br />
                                                <span className="text-xs opacity-75">Recommended: PNG with transparent background. Max 2MB.</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Links Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider">
                                        <Globe size={16} className="text-indigo-500" />
                                        Website URL
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-focus-within:bg-indigo-50 transition-colors">
                                            <Globe className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                        </div>
                                        <input
                                            type="url"
                                            value={config.site_url}
                                            onChange={(e) => setConfig({ ...config, site_url: e.target.value })}
                                            className="w-full pl-16 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                            placeholder="https://yourcompany.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider">
                                        <Layout size={16} className="text-indigo-500" />
                                        Custom Subdomain
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1 group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-focus-within:bg-indigo-50 transition-colors">
                                                <Layout className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                value={config.subdomain}
                                                onChange={(e) => setConfig({ ...config, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                                className="w-full pl-16 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                                placeholder="mycompany"
                                            />
                                        </div>
                                        <span className="hidden sm:inline-flex items-center px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-500 font-medium whitespace-nowrap">
                                            .doctransfer.com
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    <span className="font-medium text-gray-900">Note:</span> Changes apply immediately to all shared links.
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Saving Changes...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Save Branding
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Live Preview */}
                <div className="lg:col-span-5">
                    <div className="sticky top-8 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                Live Preview
                            </h3>
                            <div className="text-xs font-medium px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                                {previewDevice === 'desktop' ? 'Desktop View' : 'Mobile View'}
                            </div>
                        </div>

                        {/* Device Mockup */}
                        <div className={`transition-all duration-500 ease-in-out ${previewDevice === 'mobile' ? 'max-w-[320px] mx-auto' : 'w-full'}`}>
                            <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl ring-8 ring-gray-100 relative overflow-hidden">
                                {/* Camera Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-gray-900 rounded-b-xl z-20"></div>

                                {/* Screen Content */}
                                <div className="bg-white w-full h-[600px] rounded-[2rem] overflow-hidden flex flex-col relative isolate">
                                    {/* Mockup Header */}
                                    <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white/90 backdrop-blur-md sticky top-0 z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-gray-100 px-4 py-1.5 rounded-full text-[10px] font-medium text-gray-500">
                                            <Lock size={10} className="text-gray-400" />
                                            secure.doctransfer.com
                                        </div>
                                        <div className="w-8" />
                                    </div>

                                    {/* Mockup Body */}
                                    <div className="flex-1 p-8 flex flex-col items-center justify-center overflow-y-auto bg-gray-50/50 relative">
                                        {/* Background Pattern */}
                                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                                        {/* Brand Logo */}
                                        <div className="mb-10 h-16 flex items-center justify-center transition-all duration-500 relative z-10">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Brand" className="h-full object-contain animate-scale-in drop-shadow-sm" />
                                            ) : (
                                                <div className="text-gray-300 text-sm font-medium border-2 border-dashed border-gray-200 rounded-xl px-6 py-3 bg-white/50">
                                                    Your Logo Here
                                                </div>
                                            )}
                                        </div>

                                        {/* Document Card */}
                                        <div className="w-full max-w-xs bg-white rounded-3xl shadow-xl shadow-indigo-100/50 p-8 border border-white relative z-10 animate-slide-up">
                                            <div className="flex justify-center mb-6">
                                                <div
                                                    className="w-20 h-20 rounded-2xl flex items-center justify-center transition-colors duration-300 shadow-inner"
                                                    style={{ backgroundColor: `${config.brand_color}10`, color: config.brand_color }}
                                                >
                                                    <FileText size={40} />
                                                </div>
                                            </div>

                                            <div className="text-center mb-8">
                                                <h4 className="font-bold text-gray-900 text-xl mb-2">Confidential_Q4.pdf</h4>
                                                <p className="text-sm text-gray-500 font-medium">2.4 MB • PDF Document</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="h-12 bg-gray-50 rounded-2xl border border-gray-100 flex items-center px-4 gap-3">
                                                    <Lock size={16} className="text-gray-400" />
                                                    <div className="flex gap-1">
                                                        <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse"></div>
                                                        <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                                        <div className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                                    </div>
                                                </div>

                                                <button
                                                    className="w-full py-4 rounded-2xl text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 hover:brightness-110 active:scale-95"
                                                    style={{
                                                        backgroundColor: config.brand_color,
                                                        boxShadow: `0 10px 20px -10px ${config.brand_color}66`
                                                    }}
                                                >
                                                    <Download size={18} />
                                                    Download File
                                                </button>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
                                                <Shield size={14} className="text-green-500" />
                                                <span>End-to-end Encrypted</span>
                                            </div>
                                        </div>

                                        {/* Footer Link */}
                                        {config.site_url && (
                                            <div className="mt-10 flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer group">
                                                <span>Visit {config.site_url.replace(/^https?:\/\//, '')}</span>
                                                <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandingSettings;
