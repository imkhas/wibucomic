import { BookOpen, Library, User, LogOut, LogIn, Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user: any;
  onAuthClick: () => void;
  onLogout: () => void;
}

export function Navbar({ currentPage, onNavigate, user, onAuthClick, onLogout }: NavbarProps) {
  const { selectedLanguage, setSelectedLanguage, availableLanguages } = useLanguage();

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              <BookOpen className="w-8 h-8" />
              <span>WibuComic</span>
            </button>

            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => onNavigate('home')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'home'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                Home
              </button>
              <button
                onClick={() => onNavigate('browse')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'browse'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                Browse
              </button>
              {user && (
                <button
                  onClick={() => onNavigate('library')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'library'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Library className="w-4 h-4" />
                  Library
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selection Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 hover:bg-white hover:border-blue-300 transition-all text-sm font-medium">
                <Languages className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">
                  {availableLanguages.find(l => l.code === selectedLanguage)?.flag}{' '}
                  {availableLanguages.find(l => l.code === selectedLanguage)?.name}
                </span>
                <span className="sm:hidden">
                  {availableLanguages.find(l => l.code === selectedLanguage)?.flag}
                </span>
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                <div className="py-1">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${selectedLanguage === lang.code
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <span>{lang.flag} {lang.name}</span>
                      {selectedLanguage === lang.code && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-2 pl-4 border-l border-gray-200">
              {user ? (
                <>
                  <button
                    onClick={() => onNavigate('profile')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === 'profile'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Profile</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={onAuthClick}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
