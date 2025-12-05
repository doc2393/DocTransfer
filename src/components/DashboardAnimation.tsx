import React from 'react';
import { Lock, FileText, Shield, Globe, Check, Cloud } from 'lucide-react';

const DashboardAnimation: React.FC = () => {
    return (
        <div className="dashboard-anim-container">
            {/* Central Element */}
            <div className="animate-pulse-soft" style={{
                width: '120px',
                height: '120px',
                background: 'white',
                borderRadius: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 50px -10px rgba(79, 70, 229, 0.3)',
                zIndex: 20,
                position: 'relative'
            }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Lock size={48} color="white" />
                </div>

                {/* Orbiting Ring */}
                <div className="animate-rotate-slow" style={{
                    position: 'absolute',
                    width: '240px',
                    height: '240px',
                    border: '2px dashed rgba(99, 102, 241, 0.2)',
                    borderRadius: '50%',
                    zIndex: -1
                }} />
            </div>

            {/* Floating Icons */}
            <div className="anim-icon-wrapper animate-float" style={{
                top: '40px',
                left: '20%',
                width: '60px',
                height: '60px',
                animationDelay: '0s'
            }}>
                <FileText size={24} color="#4f46e5" />
            </div>

            <div className="anim-icon-wrapper animate-float-delayed" style={{
                bottom: '50px',
                left: '25%',
                width: '50px',
                height: '50px',
                animationDelay: '1s'
            }}>
                <Shield size={20} color="#10b981" />
            </div>

            <div className="anim-icon-wrapper animate-float" style={{
                top: '50px',
                right: '20%',
                width: '56px',
                height: '56px',
                animationDelay: '2s'
            }}>
                <Globe size={24} color="#3b82f6" />
            </div>

            <div className="anim-icon-wrapper animate-float-delayed" style={{
                bottom: '40px',
                right: '25%',
                width: '48px',
                height: '48px',
                animationDelay: '3s'
            }}>
                <Check size={20} color="#ec4899" />
            </div>

            {/* Background Clouds/Decorations */}
            <Cloud size={100} color="white" style={{ position: 'absolute', top: '20px', left: '10%', opacity: 0.4 }} />
            <Cloud size={80} color="white" style={{ position: 'absolute', bottom: '20px', right: '10%', opacity: 0.3 }} />

            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 1,
                pointerEvents: 'none'
            }} />
        </div>
    );
};

export default DashboardAnimation;
