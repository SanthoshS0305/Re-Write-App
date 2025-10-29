import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeContextProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { StoryProvider } from './context/StoryContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import StoryList from './components/stories/StoryList';
import ChapterList from './components/stories/ChapterList';
import TextEditor from './components/editor/TextEditor';
import useAuth from './hooks/useAuth';
import LoadingSpinner from './components/common/LoadingSpinner';

// Wrapper to conditionally show navbar
const ConditionalNavbar = () => {
  const location = useLocation();
  const isEditorPage = location.pathname.includes('/chapters/');
  
  return !isEditorPage ? <Navbar /> : null;
};

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Main App Routes
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/stories" /> : <Navigate to="/login" />}
      />
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/stories" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/stories" replace /> : <Register />} 
      />
      <Route
        path="/stories"
        element={
          <ProtectedRoute>
            <StoryList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stories/:storyId"
        element={
          <ProtectedRoute>
            <ChapterList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stories/:storyId/chapters/:chapterId"
        element={
          <ProtectedRoute>
            <TextEditor />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeContextProvider>
        <Router>
          <AuthProvider>
            <StoryProvider>
              <div className="app">
                <ConditionalNavbar />
                <main className="app-main">
                  <AppRoutes />
                </main>
              </div>
            </StoryProvider>
          </AuthProvider>
        </Router>
      </ThemeContextProvider>
    </ErrorBoundary>
  );
}

export default App;

