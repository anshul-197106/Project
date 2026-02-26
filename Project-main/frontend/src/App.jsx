import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import GigListPage from './pages/GigListPage';
import GigDetailPage from './pages/GigDetailPage';
import CreateGigPage from './pages/CreateGigPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SavedGigsPage from './pages/SavedGigsPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import StripeConnectPage from './pages/StripeConnectPage';
import MessagesPage from './pages/MessagesPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#f0f0f5',
              border: '1px solid rgba(108, 99, 255, 0.3)',
              borderRadius: '8px',
            },
          }}
        />
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 70px)' }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/gigs" element={<GigListPage />} />
            <Route path="/gigs/:id" element={<GigDetailPage />} />
            <Route path="/gigs/new" element={
              <ProtectedRoute><CreateGigPage /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/saved-gigs" element={
              <ProtectedRoute><SavedGigsPage /></ProtectedRoute>
            } />
            <Route path="/payment-success" element={
              <ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>
            } />
            <Route path="/stripe-connect" element={
              <ProtectedRoute><StripeConnectPage /></ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute><MessagesPage /></ProtectedRoute>
            } />
            <Route path="/messages/:conversationId" element={
              <ProtectedRoute><MessagesPage /></ProtectedRoute>
            } />
            <Route path="/profile/:id" element={<ProfilePage />} />
          </Routes>
        </main>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
