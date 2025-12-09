import { useState, useEffect } from 'react';
import { Sparkles, Send, Loader2, BookOpen, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { Comic } from '../types/database';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface MangaResult {
  id: string;
  title: string;
  coverUrl: string | null;
  status: string;
}

interface AIRecommendationsProps {
  onComicClick?: (comic: Comic) => void;
}

export function AIRecommendations({ onComicClick }: AIRecommendationsProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mangaResults, setMangaResults] = useState<MangaResult[]>([]);
  const { user } = useAuth();
  const toast = useToast();

  // Load conversation history on mount
  useEffect(() => {
    if (user) {
      loadConversationHistory();
    }
  }, [user]);

  const loadConversationHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('messages')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      // maybeSingle() returns null if no rows, so no error
      if (error) throw error;
      
      if (data && data.messages) {
        setMessages(data.messages.slice(-10)); // Show last 10 messages
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      // Don't show error to user - it's fine if there's no history yet
    }
  };

  const getRecommendations = async () => {
    if (!user) {
      toast.warning('Please sign in to get personalized recommendations');
      return;
    }

    if (!prompt.trim()) {
      toast.warning('Please enter a question or request');
      return;
    }

    setLoading(true);
    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');

    try {
      const { data, error } = await supabase.functions.invoke('manga-recommendations', {
        body: {
          userId: user.id,
          prompt: prompt,
          includeMangaDex: true,
          conversationHistory: messages
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to get recommendations');
      }

      if (!data) {
        throw new Error('No data returned from recommendations');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.recommendations || 'No recommendations available',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setMangaResults(data.mangaResults || []);

      toast.success('Recommendations generated!');
    } catch (err: any) {
      console.error('Failed to get recommendations:', err);
      
      // More specific error messages
      let errorMessage = 'Failed to get recommendations';
      if (err.message?.includes('Edge Function returned a non-2xx')) {
        errorMessage = 'AI service is currently unavailable. Please try again later.';
      } else if (err.message?.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      
      // Remove the user message if request failed
      setMessages(prev => prev.slice(0, -1));
      setPrompt(userMessage.content); // Restore prompt
    } finally {
      setLoading(false);
    }
  };

  const handleMangaClick = (manga: MangaResult) => {
    if (onComicClick) {
      const comic: Comic = {
        id: manga.id,
        title: manga.title,
        description: null,
        author: null,
        cover_image: manga.coverUrl,
        genre: null,
        status: manga.status === 'completed' ? 'completed' : 'ongoing',
        total_pages: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      onComicClick(comic);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setMangaResults([]);
    toast.success('Conversation cleared');
  };

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 text-center">
        <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Recommendations</h3>
        <p className="text-gray-600 mb-4">
          Sign in to get personalized manga recommendations based on your reading history
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI Recommendations</h2>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear Chat
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Conversation History */}
        {messages.length > 0 && (
          <div className="bg-white rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manga Results */}
        {mangaResults.length > 0 && (
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Found on MangaDex:</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {mangaResults.map((manga) => (
                <button
                  key={manga.id}
                  onClick={() => handleMangaClick(manga)}
                  className="group relative aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-all"
                >
                  {manga.coverUrl ? (
                    <img
                      src={manga.coverUrl}
                      alt={manga.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <p className="text-white text-xs font-medium line-clamp-2">{manga.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                getRecommendations();
              }
            }}
            placeholder="Ask me anything! E.g., 'Recommend manga similar to One Piece' or 'What should I read next?'"
            className="w-full p-4 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={3}
            disabled={loading}
          />
          <button
            onClick={getRecommendations}
            disabled={loading || !prompt.trim()}
            className="absolute bottom-3 right-3 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Quick Suggestions */}
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-medium">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Recommend based on my bookmarks',
                'Something similar to what I just read',
                'Hidden gems in action genre',
                'Completed manga I can binge read',
                'Manga with strong female leads',
                'Underrated psychological thrillers'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full hover:bg-purple-50 hover:border-purple-300 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}