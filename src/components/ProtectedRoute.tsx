import { useUser } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isLoaded, isSignedIn } = useUser()

    // Show loading state while checking authentication
    if (!isLoaded) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '50px',
                    borderRadius: '24px',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                }}>
                    {/* Spinning Gradient Loader */}
                    <div style={{
                        position: 'relative',
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 24px',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}>
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                            @keyframes pulse {
                                0%, 100% { transform: scale(1); opacity: 1; }
                                50% { transform: scale(1.05); opacity: 0.9; }
                            }
                            @keyframes shimmer {
                                0% { background-position: -200% center; }
                                100% { background-position: 200% center; }
                            }
                        `}</style>
                        <div style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            border: '6px solid transparent',
                            borderTopColor: '#667eea',
                            borderRightColor: '#764ba2',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            width: '70%',
                            height: '70%',
                            top: '15%',
                            left: '15%',
                            border: '4px solid transparent',
                            borderBottomColor: '#667eea',
                            borderLeftColor: '#764ba2',
                            borderRadius: '50%',
                            animation: 'spin 1.5s linear infinite reverse'
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            width: '40%',
                            height: '40%',
                            top: '30%',
                            left: '30%',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            borderRadius: '50%',
                            opacity: 0.3
                        }}></div>
                    </div>

                    {/* Animated Loading Text */}
                    <div style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        animation: 'shimmer 3s linear infinite',
                        marginBottom: '8px'
                    }}>
                        Loading
                    </div>

                    {/* Loading Dots */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '12px'
                    }}>
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`
                                }}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // Redirect to sign-in if not authenticated
    if (!isSignedIn) {
        return <Navigate to="/sign-in" replace />
    }

    // Render protected content if authenticated
    return <>{children}</>
}
