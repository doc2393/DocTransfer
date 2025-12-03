import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'
import DataRoom from './DataRoom'
import DocumentSharing from './DocumentSharing'
import ViewDocument from './ViewDocument'
import SignIn from './SignIn'
import SignUp from './SignUp'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up/*" element={<SignUp />} />
        <Route
          path="/dataroom"
          element={
            <ProtectedRoute>
              <DataRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/document-sharing"
          element={
            <ProtectedRoute>
              <DocumentSharing />
            </ProtectedRoute>
          }
        />
        <Route path="/view/:shareLink" element={<ViewDocument />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
