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
                    padding: '40px',
                    borderRadius: '16px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '18px',
                        color: '#667eea',
                        fontWeight: '600'
                    }}>
                        Loading...
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
