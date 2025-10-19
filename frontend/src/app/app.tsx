import { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ToastProvider, useToast } from '../contexts/ToastContext';
import { Navbar } from '../components/Navbar';
import { AuthModal } from '../components/AuthModal';
import { Home } from '../pages/Home';
import { Browse } from '../pages/Browse';
import { ComicDetail } from '../pages/ComicDetail';
import { Reader } from '../pages/Reader';
import { Library } from '../pages/Library';
import { Profile } from '../pages/Profile';
import { Comic } from '../types/database';

type Page = 'home' | 'browse' | 'library' | 'profile' | 'comic-detail' | 'reader';

interface AppState {
  page: Page;
  selectedComic: Comic | null;
  selectedChapterId: string | null;
}

function AppContent() {
  const [state, setState] = useState<AppState>({
    page: 'home',
    selectedComic: null,
    selectedChapterId: null,
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, signOut } = useAuth();
  const toast = useToast();

  const navigateTo = (page: Page) => {
    if (page === 'library' && !user) {
      toast.warning('Please sign in to view your library');
      setShowAuthModal(true);
      return;
    }
    if (page === 'profile' && !user) {
      toast.warning('Please sign in to view your profile');
      setShowAuthModal(true);
      return;
    }
    setState(prev => ({ ...prev, page }));
  };

  const handleComicClick = (comic: Comic) => {
    setState({
      page: 'comic-detail',
      selectedComic: comic,
      selectedChapterId: null,
    });
  };

  const handleStartReading = (chapterId?: string) => {
    setState(prev => ({
      ...prev,
      page: 'reader',
      selectedChapterId: chapterId || null,
    }));
  };

  const handleCloseReader = () => {
    setState(prev => ({
      ...prev,
      page: 'comic-detail',
    }));
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setState({
        page: 'home',
        selectedComic: null,
        selectedChapterId: null,
      });
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleBack = () => {
    setState(prev => ({
      ...prev,
      page: 'browse',
      selectedComic: null,
    }));
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    toast.success('Welcome back!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {state.page !== 'reader' && (
        <Navbar
          currentPage={state.page}
          onNavigate={navigateTo}
          user={user}
          onAuthClick={() => setShowAuthModal(true)}
          onLogout={handleLogout}
        />
      )}

      <main className={state.page !== 'reader' ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : ''}>
        {state.page === 'home' && <Home onComicClick={handleComicClick} />}
        {state.page === 'browse' && <Browse onComicClick={handleComicClick} />}
        {state.page === 'library' && <Library onComicClick={handleComicClick} />}
        {state.page === 'profile' && <Profile />}
        {state.page === 'comic-detail' && state.selectedComic && (
          <ComicDetail
            comicId={state.selectedComic.id}
            onStartReading={handleStartReading}
            onBack={handleBack}
          />
        )}
        {state.page === 'reader' && state.selectedComic && (
          <Reader 
            comicId={state.selectedComic.id}
            chapterId={state.selectedChapterId}
            onClose={handleCloseReader} 
          />
        )}
      </main>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;