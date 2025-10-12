import { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
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

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, signOut } = useAuth();

  const handleComicClick = (comic: Comic) => {
    setSelectedComic(comic);
    setCurrentPage('comic-detail');
  };

  const handleStartReading = () => {
    if (selectedComic) {
      setCurrentPage('reader');
    }
  };

  const handleCloseReader = () => {
    setCurrentPage('comic-detail');
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage !== 'reader' && (
        <Navbar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page as Page)}
          user={user}
          onAuthClick={() => setShowAuthModal(true)}
          onLogout={handleLogout}
        />
      )}

      <main className={currentPage !== 'reader' ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : ''}>
        {currentPage === 'home' && <Home onComicClick={handleComicClick} />}
        {currentPage === 'browse' && <Browse onComicClick={handleComicClick} />}
        {currentPage === 'library' && <Library onComicClick={handleComicClick} />}
        {currentPage === 'profile' && <Profile />}
        {currentPage === 'comic-detail' && selectedComic && (
          <ComicDetail
            comicId={selectedComic.id}
            onStartReading={handleStartReading}
            onBack={() => setCurrentPage('browse')}
          />
        )}
        {currentPage === 'reader' && selectedComic && (
          <Reader comicId={selectedComic.id} onClose={handleCloseReader} />
        )}
      </main>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
