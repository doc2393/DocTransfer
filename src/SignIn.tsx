import { SignIn } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

export default function SignInPage() {
    const navigate = useNavigate()

    return (
        <div style={{
            minHeight: '100vh',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                maxWidth: '480px',
                width: '100%'
            }}>
                <div style={{
                    textAlign: 'center',
                    marginBottom: '32px'
                }}>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '8px'
                    }}>
                        Welcome Back
                    </h1>
                    <p style={{
                        color: '#6b7280',
                        fontSize: '16px'
                    }}>
                        Sign in to access your secure file transfers
                    </p>
                </div>

                <SignIn
                    appearance={{
                        elements: {
                            rootBox: 'mx-auto',
                            card: 'shadow-none'
                        }
                    }}
                    path="/sign-in"
                    signUpUrl="/sign-up"
                    fallbackRedirectUrl="/dataroom"
                />

                <div style={{
                    marginTop: '24px',
                    textAlign: 'center'
                }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            color: '#6b7280',
                            fontSize: '14px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        ← Back to home
                    </button>
                </div>
            </div>
        </div>
    )
}
