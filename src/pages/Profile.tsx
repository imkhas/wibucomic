import { User, Mail, Calendar, BookMarked, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function Profile() {
  const { user } = useAuth();
  const { bookmarks } = useBookmarks(user?.id);
  const [readingProgressCount, setReadingProgressCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchReadingProgressCount();
    }
  }, [user]);

  async function fetchReadingProgressCount() {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('reading_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setReadingProgressCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch reading progress count:', err);
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-gray-900">Profile</h1>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Account</h2>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookMarked className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Bookmarks</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{bookmarks.length}</p>
            <p className="text-sm text-gray-600 mt-1">Comics saved</p>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-900">Reading</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{readingProgressCount}</p>
            <p className="text-sm text-gray-600 mt-1">Comics in progress</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Member Since</h3>
            </div>
            <p className="text-lg font-bold text-orange-600">
              {new Date(user.created_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-gray-600">Email</span>
            <span className="font-medium text-gray-900">{user.email}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-gray-600">User ID</span>
            <span className="font-mono text-sm text-gray-900">{user.id}</span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-gray-600">Account Created</span>
            <span className="font-medium text-gray-900">
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
