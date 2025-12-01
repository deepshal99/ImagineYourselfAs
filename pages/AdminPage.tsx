import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PERSONAS, buildPrompt, getFallbackCoverUrl } from '../constants';
import { Persona, PersonaCategory } from '../types';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface UserData {
  id: string;
  email: string;
  created_at: string;
  credits: number;
  is_unlimited: boolean;
  generation_count: number;
  last_generation: string | null;
}

interface GenerationData {
  id: string;
  user_id: string;
  user_email: string;
  persona_id: string;
  persona_name: string;
  created_at: string;
  image_url: string;
}

interface StatsData {
  totalUsers: number;
  totalGenerations: number;
  totalCreditsConsumed: number;
  totalCreditsRemaining: number;
  generationsToday: number;
  generationsThisWeek: number;
  cacheHitRate: number;
  avgGenerationsPerUser: number;
}

interface PersonaStats {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

interface ManagedPersona extends Persona {
  order: number;
  isVisible: boolean;
}

// ============================================================================
// ADMIN EMAILS
// ============================================================================
const ADMIN_EMAILS = (
  import.meta.env.VITE_ADMIN_EMAILS?.split(',').map((e: string) => e.trim()) || [
    'your-email@gmail.com',
  ]
);

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}> = ({ title, value, subtitle, icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
    green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    yellow: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
    red: 'from-red-500/20 to-red-600/5 border-red-500/20',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    green: 'text-emerald-400',
    yellow: 'text-amber-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-6 backdrop-blur-sm`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-zinc-800/50 ${iconColorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <h3 className="text-zinc-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-zinc-500 text-xs mt-1">{subtitle}</p>}
    </div>
  );
};

const UserRow: React.FC<{
  user: UserData;
  onAddCredits: (userId: string, amount: number) => void;
  onToggleUnlimited: (userId: string, currentStatus: boolean) => void;
}> = ({ user, onAddCredits, onToggleUnlimited }) => {
  const [creditAmount, setCreditAmount] = useState(5);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-zinc-800/50 last:border-0">
      <div 
        className="flex items-center justify-between p-4 hover:bg-zinc-800/30 cursor-pointer transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {user.email?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-white font-medium">{user.email}</p>
            <p className="text-zinc-500 text-xs">
              Joined {new Date(user.created_at).toLocaleDateString()} • {user.generation_count} generations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className={`font-bold ${user.is_unlimited ? 'text-emerald-400' : 'text-white'}`}>
              {user.is_unlimited ? '∞ Unlimited' : `${user.credits} credits`}
            </p>
            {user.last_generation && (
              <p className="text-zinc-500 text-xs">
                Last: {new Date(user.last_generation).toLocaleDateString()}
              </p>
            )}
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 bg-zinc-800/20">
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-zinc-800/50">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                className="w-20 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                min="1"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddCredits(user.id, creditAmount);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Add Credits
              </button>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleUnlimited(user.id, user.is_unlimited);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                user.is_unlimited 
                  ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                  : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
              }`}
            >
              {user.is_unlimited ? 'Revoke Unlimited' : 'Grant Unlimited'}
            </button>

            <div className="flex-1" />
            
            <span className="text-zinc-500 text-xs">
              User ID: {user.id.substring(0, 8)}...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const PersonaBarChart: React.FC<{ data: PersonaStats[] }> = ({ data }) => {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="space-y-3">
      {data.slice(0, 10).map((persona, index) => (
        <div key={persona.id} className="flex items-center gap-3">
          <span className="text-zinc-500 text-sm w-6">{index + 1}.</span>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white text-sm font-medium truncate">{persona.name}</span>
              <span className="text-zinc-400 text-sm">{persona.count}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${(persona.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// PERSONA EDITOR MODAL
// ============================================================================

interface PersonaEditorProps {
  persona: ManagedPersona | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: Partial<ManagedPersona> & { id?: string }) => void;
  isNew?: boolean;
}

const PersonaEditorModal: React.FC<PersonaEditorProps> = ({ persona, isOpen, onClose, onSave, isNew = false }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PersonaCategory>('Movie');
  const [cover, setCover] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [styleDescription, setStyleDescription] = useState('');
  const [showPromptHelper, setShowPromptHelper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (persona) {
      setName(persona.name);
      setCategory(persona.category);
      setCover(persona.cover);
      setPrompt(persona.prompt);
    } else {
      setName('');
      setCategory('Movie');
      setCover('');
      setPrompt('');
    }
    setStyleDescription('');
    setShowPromptHelper(false);
  }, [persona, isOpen]);

  const generatePromptWithAI = async () => {
    if (!name || !styleDescription) {
      toast.error('Please enter a name and style description');
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      // Use built-in prompt template
      const generatedPrompt = buildPrompt(name, styleDescription);
      setPrompt(generatedPrompt);
      toast.success('Prompt generated!');
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast.error('Failed to generate prompt');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const generateCoverWithAI = async () => {
    if (!prompt) {
      toast.error('Please add a prompt first');
      return;
    }

    setIsGeneratingCover(true);
    try {
      // Use the generate-asset edge function
      const { data, error } = await supabase.functions.invoke('generate-asset', {
        body: { 
          prompt: `Movie poster cover art for ${name}. ${styleDescription || 'Cinematic, dramatic lighting, high quality'}`
        }
      });

      if (error) throw error;
      if (data?.image) {
        // Convert to data URL if it's just base64
        const imageUrl = data.image.startsWith('data:') 
          ? data.image 
          : `data:image/png;base64,${data.image}`;
        setCover(imageUrl);
        toast.success('Cover generated!');
      }
    } catch (error) {
      console.error('Error generating cover:', error);
      toast.error('Failed to generate cover. Using fallback.');
      // Use Pollinations fallback
      setCover(getFallbackCoverUrl(prompt));
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `covers/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('creations') // Reusing creations bucket, ideally use a dedicated 'assets' bucket
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('creations')
        .getPublicUrl(fileName);

      setCover(publicUrl);
      toast.success('Cover uploaded successfully!');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Failed to upload cover');
    } finally {
      setIsUploadingCover(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!name || !prompt) {
      toast.error('Name and prompt are required');
      return;
    }

    onSave({
      id: persona?.id || `custom_${Date.now()}`,
      name,
      category,
      cover: cover || getFallbackCoverUrl(prompt),
      prompt,
      order: persona?.order || 999,
      isVisible: true,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">
            {isNew ? '✨ Add New Persona' : '✏️ Edit Persona'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* Preview */}
          <div className="flex gap-6">
            <div className="w-32 flex-shrink-0">
              <div className="aspect-[2/3] bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700">
                {cover ? (
                  <img src={cover} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isUploadingCover ? (
                    <>
                      <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Image
                    </>
                  )}
                </button>
                <button
                  onClick={generateCoverWithAI}
                  disabled={isGeneratingCover || !prompt}
                  className="w-full px-3 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isGeneratingCover ? (
                    <>
                      <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      Generate AI Cover
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., The Matrix"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PersonaCategory)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Movie">🎬 Movie</option>
                  <option value="Series">📺 Series</option>
                  <option value="YouTube">▶️ YouTube</option>
                  <option value="Other">🎮 Other</option>
                </select>
              </div>

              {/* Cover URL */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Cover Image URL</label>
                <input
                  type="text"
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                  placeholder="https://... or leave empty to generate"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Prompt Section */}
          <div className="border-t border-zinc-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-zinc-400">Prompt *</label>
              <button
                onClick={() => setShowPromptHelper(!showPromptHelper)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {showPromptHelper ? 'Hide Helper' : '🤖 Use AI Helper'}
              </button>
            </div>

            {showPromptHelper && (
              <div className="bg-zinc-800/50 rounded-xl p-4 mb-4 space-y-4">
                <p className="text-xs text-zinc-400">
                  Describe the visual style and signature elements, and we'll generate a prompt that fits our system.
                </p>
                <textarea
                  value={styleDescription}
                  onChange={(e) => setStyleDescription(e.target.value)}
                  placeholder="e.g., Cyberpunk sci-fi aesthetic. Signature elements: Black leather trench coats, digital rain, green tinted lighting, futuristic cityscapes, sunglasses. Lighting: Dark with neon highlights. Atmosphere: Mysterious, technological, philosophical."
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
                />
                <button
                  onClick={generatePromptWithAI}
                  disabled={isGeneratingPrompt || !name || !styleDescription}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {isGeneratingPrompt ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>✨ Generate Prompt</>
                  )}
                </button>
              </div>
            )}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Full prompt for image generation..."
              rows={6}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm font-mono"
            />
            <p className="text-xs text-zinc-500 mt-2">
              Tip: Include signature elements, lighting style, and atmosphere for best results.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name || !prompt}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {isNew ? 'Add Persona' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DRAGGABLE PERSONA CARD
// ============================================================================

interface DraggablePersonaCardProps {
  persona: ManagedPersona;
  index: number;
  stat?: PersonaStats;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragTarget: boolean;
}

const DraggablePersonaCard: React.FC<DraggablePersonaCardProps> = ({
  persona,
  index,
  stat,
  onEdit,
  onDelete,
  onToggleVisibility,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragTarget,
}) => {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={onDragEnd}
      className={`
        flex items-center gap-4 p-4 bg-zinc-800/30 rounded-xl border transition-all cursor-move
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${isDragTarget ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800/50'}
        ${!persona.isVisible ? 'opacity-60' : ''}
      `}
    >
      {/* Drag Handle */}
      <div className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Cover */}
      <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800">
        <img 
          src={persona.cover} 
          alt={persona.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getFallbackCoverUrl(persona.prompt);
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-white font-medium truncate">{persona.name}</h4>
          {!persona.isVisible && (
            <span className="px-2 py-0.5 bg-red-900/50 text-red-400 text-[10px] rounded-full">HIDDEN</span>
          )}
        </div>
        <p className="text-zinc-500 text-xs truncate">{persona.category}</p>
      </div>

      {/* Stats */}
      <div className="text-right mr-4">
        <p className="text-white font-bold">{stat?.count || 0}</p>
        <p className="text-zinc-500 text-xs">uses</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          title={persona.isVisible ? 'Hide' : 'Show'}
        >
          {persona.isVisible ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          title="Edit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type TabType = 'overview' | 'users' | 'generations' | 'analytics' | 'manage-personas';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Data states
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [generations, setGenerations] = useState<GenerationData[]>([]);
  const [personaStats, setPersonaStats] = useState<PersonaStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Persona management states
  const [managedPersonas, setManagedPersonas] = useState<ManagedPersona[]>([]);
  const [personaSearchQuery, setPersonaSearchQuery] = useState('');
  const [editingPersona, setEditingPersona] = useState<ManagedPersona | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isNewPersona, setIsNewPersona] = useState(false);
  const [isMagicAddOpen, setIsMagicAddOpen] = useState(false);
  const [magicName, setMagicName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Drag and drop states
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isOrderDirty, setIsOrderDirty] = useState(false);
  const [sortMethod, setSortMethod] = useState<'manual' | 'alpha' | 'popular' | 'newest'>('manual');

  // Check if user is admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/');
        return;
      }
      
      const email = user.email?.toLowerCase() || '';
      if (ADMIN_EMAILS.map((e: string) => e.toLowerCase()).includes(email)) {
        setIsAdmin(true);
      } else {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
      }
    }
  }, [user, authLoading, navigate]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      // Fetch users with their credit info
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('*');

      // Fetch all creations
      const { data: creationsData, error: creationsError } = await supabase
        .from('creations')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch custom personas from DB
      const { data: customPersonasData } = await supabase
        .from('discovered_personas')
        .select('*')
        .order('created_at', { ascending: true });

      if (creditsError) {
        console.error('Error fetching credits:', creditsError);
      }
      if (creationsError) {
        console.error('Error fetching creations:', creationsError);
      }

      // Process users data
      const userMap = new Map<string, UserData>();
      
      (creditsData || []).forEach((credit: any) => {
        userMap.set(credit.user_id, {
          id: credit.user_id,
          email: credit.email || credit.user_id.substring(0, 8) + '...',
          created_at: credit.created_at || new Date().toISOString(),
          credits: credit.credits || 0,
          is_unlimited: credit.is_unlimited || false,
          generation_count: 0,
          last_generation: null,
        });
      });

      (creationsData || []).forEach((creation: any) => {
        const user = userMap.get(creation.user_id);
        if (user) {
          user.generation_count++;
          if (!user.last_generation || new Date(creation.created_at) > new Date(user.last_generation)) {
            user.last_generation = creation.created_at;
          }
        } else {
          userMap.set(creation.user_id, {
            id: creation.user_id,
            email: creation.user_id.substring(0, 8) + '...',
            created_at: creation.created_at,
            credits: 0,
            is_unlimited: false,
            generation_count: 1,
            last_generation: creation.created_at,
          });
        }
      });

      const usersArray = Array.from(userMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setUsers(usersArray);

      // Process generations
      const allPersonas = [...PERSONAS, ...(customPersonasData || [])];
      const generationsArray: GenerationData[] = (creationsData || []).map((creation: any) => {
        const persona = allPersonas.find(p => p.id === creation.persona_id);
        const userEmail = userMap.get(creation.user_id)?.email || creation.user_id.substring(0, 8) + '...';
        return {
          id: creation.id,
          user_id: creation.user_id,
          user_email: userEmail,
          persona_id: creation.persona_id,
          persona_name: persona?.name || creation.persona_id,
          created_at: creation.created_at,
          image_url: creation.image_url,
        };
      });
      setGenerations(generationsArray);

      // Calculate persona stats
      const personaCounts = new Map<string, number>();
      (creationsData || []).forEach((creation: any) => {
        const count = personaCounts.get(creation.persona_id) || 0;
        personaCounts.set(creation.persona_id, count + 1);
      });

      const totalGenerations = creationsData?.length || 0;
      const personaStatsArray: PersonaStats[] = Array.from(personaCounts.entries())
        .map(([id, count]) => {
          const persona = allPersonas.find(p => p.id === id);
          return {
            id,
            name: persona?.name || id,
            count,
            percentage: totalGenerations > 0 ? (count / totalGenerations) * 100 : 0,
          };
        })
        .sort((a, b) => b.count - a.count);
      setPersonaStats(personaStatsArray);

      // Build managed personas list
      // DB personas take precedence over built-in ones (allows editing/hiding built-ins)
      const dbPersonaMap = new Map<string, any>();
      (customPersonasData || []).forEach((p: any) => {
        dbPersonaMap.set(p.id, p);
      });

      const managed: ManagedPersona[] = [];
      
      // Add built-in personas (with DB overrides if they exist)
      PERSONAS.forEach((p, i) => {
        const dbOverride = dbPersonaMap.get(p.id);
        if (dbOverride) {
          // Use DB version (edited built-in persona)
          managed.push({
            id: dbOverride.id,
            name: dbOverride.name,
            category: dbOverride.category as PersonaCategory,
            cover: dbOverride.cover,
            prompt: dbOverride.prompt,
            order: dbOverride.display_order ?? i,
            isVisible: dbOverride.is_visible !== false,
          });
          dbPersonaMap.delete(p.id); // Remove so we don't add it again
        } else {
          // Use built-in version
          managed.push({
            ...p,
            order: i,
            isVisible: true,
          });
        }
      });
      
      // Add remaining custom personas (ones not overriding built-ins)
      dbPersonaMap.forEach((p, _id) => {
        managed.push({
          id: p.id,
          name: p.name,
          category: p.category as PersonaCategory,
          cover: p.cover,
          prompt: p.prompt,
          order: p.display_order ?? (PERSONAS.length + managed.length),
          isVisible: p.is_visible !== false,
        });
      });
      
      // Sort by order
      managed.sort((a, b) => a.order - b.order);
      
      setManagedPersonas(managed);

      // Calculate stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);

      const generationsToday = (creationsData || []).filter(
        (c: any) => new Date(c.created_at) >= todayStart
      ).length;
      
      const generationsThisWeek = (creationsData || []).filter(
        (c: any) => new Date(c.created_at) >= weekStart
      ).length;

      const totalCreditsRemaining = (creditsData || []).reduce(
        (sum: number, c: any) => sum + (c.credits || 0), 0
      );

      setStats({
        totalUsers: usersArray.length,
        totalGenerations,
        totalCreditsConsumed: totalGenerations,
        totalCreditsRemaining,
        generationsToday,
        generationsThisWeek,
        cacheHitRate: 0,
        avgGenerationsPerUser: usersArray.length > 0 ? totalGenerations / usersArray.length : 0,
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

  // User actions
  const handleAddCredits = async (userId: string, amount: number) => {
    try {
      const { error: rpcError } = await supabase.rpc('admin_add_credits', {
        target_user_id: userId,
        credit_amount: amount,
      });

      if (rpcError) {
        const { data: currentData } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', userId)
          .single();
        
        const currentCredits = currentData?.credits || 0;
        
        if (currentData) {
          await supabase
            .from('user_credits')
            .update({ credits: currentCredits + amount })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('user_credits')
            .insert({ user_id: userId, credits: amount, is_unlimited: false });
        }
      }

      toast.success(`Added ${amount} credits to user`);
      fetchData();
    } catch (error) {
      console.error('Error adding credits:', error);
      toast.error('Failed to add credits');
    }
  };

  const handleToggleUnlimited = async (userId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('user_credits')
        .update({ is_unlimited: !currentStatus })
        .eq('user_id', userId);

      toast.success(currentStatus ? 'Revoked unlimited access' : 'Granted unlimited access');
      fetchData();
    } catch (error) {
      console.error('Error toggling unlimited:', error);
      toast.error('Failed to update user status');
    }
  };

  // Persona management actions
  const handleSavePersona = async (personaData: Partial<ManagedPersona> & { id?: string }) => {
    try {
      const personaId = personaData.id || `custom_${Date.now()}`;
      
      // Always upsert to database (handles both new and edited personas, including built-ins)
      const { error } = await supabase
        .from('discovered_personas')
        .upsert({
          id: personaId,
          name: personaData.name,
          category: personaData.category,
          cover: personaData.cover,
          prompt: personaData.prompt,
          is_visible: personaData.isVisible ?? true,
          display_order: personaData.order ?? 999,
        }, {
          onConflict: 'id'
        });

      if (error) throw error;
      
      const existingPersona = managedPersonas.find(p => p.id === personaId);
      toast.success(existingPersona ? 'Persona updated successfully!' : 'Persona created successfully!');

      fetchData();
    } catch (error) {
      console.error('Error saving persona:', error);
      toast.error('Failed to save persona');
    }
  };

  const handleDeletePersona = async (personaId: string) => {
    const persona = managedPersonas.find(p => p.id === personaId);
    const isBuiltIn = PERSONAS.some(p => p.id === personaId);
    
    const message = isBuiltIn 
      ? 'This is a default persona. Deleting will hide it permanently. Continue?' 
      : 'Are you sure you want to delete this persona? This cannot be undone.';
    
    if (!confirm(message)) {
      return;
    }

    try {
      if (isBuiltIn) {
        // For built-in personas, mark as deleted (is_visible = false with a special flag)
        // We upsert with is_visible = false so it stays hidden
        const builtInPersona = PERSONAS.find(p => p.id === personaId)!;
        const { error } = await supabase
          .from('discovered_personas')
          .upsert({
            id: personaId,
            name: builtInPersona.name,
            category: builtInPersona.category,
            cover: builtInPersona.cover,
            prompt: builtInPersona.prompt,
            is_visible: false,
            display_order: -1, // Mark as deleted
          }, {
            onConflict: 'id'
          });

        if (error) throw error;
        toast.success('Persona removed');
      } else {
        // For custom personas, actually delete
        const { error } = await supabase
          .from('discovered_personas')
          .delete()
          .eq('id', personaId);

        if (error) throw error;
        toast.success('Persona deleted');
      }
      
      fetchData();
    } catch (error) {
      console.error('Error deleting persona:', error);
      toast.error('Failed to delete persona');
    }
  };

  const handleTogglePersonaVisibility = async (persona: ManagedPersona) => {
    try {
      // First check if persona exists in DB
      const { data: existing } = await supabase
        .from('discovered_personas')
        .select('id')
        .eq('id', persona.id)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('discovered_personas')
          .update({ is_visible: !persona.isVisible })
          .eq('id', persona.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
      } else {
        // Insert new record for this persona
        const { error } = await supabase
          .from('discovered_personas')
          .insert({
            id: persona.id,
            name: persona.name,
            category: persona.category,
            cover: persona.cover,
            prompt: persona.prompt,
            is_visible: !persona.isVisible,
          });

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
      }

      toast.success(persona.isVisible ? 'Persona hidden' : 'Persona visible');
      fetchData();
    } catch (error: any) {
      console.error('Error toggling visibility:', error);
      toast.error(`Failed to update visibility: ${error.message || 'Unknown error'}`);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (sortMethod !== 'manual') {
        toast.error('Switch to "Manual" sort to reorder');
        setDragIndex(null);
        setDragOverIndex(null);
        return;
    }

    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newPersonas = [...managedPersonas];
      const [removed] = newPersonas.splice(dragIndex, 1);
      newPersonas.splice(dragOverIndex, 0, removed);
      
      // Update order numbers in local state
      newPersonas.forEach((p, i) => {
        p.order = i;
      });
      
      setManagedPersonas(newPersonas);
      setIsOrderDirty(true);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSortChange = (method: 'manual' | 'alpha' | 'popular' | 'newest') => {
    setSortMethod(method);
    if (method === 'manual') return;

    const sorted = [...managedPersonas];
    
    if (method === 'alpha') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (method === 'popular') {
      sorted.sort((a, b) => {
        const countA = personaStats.find(s => s.id === a.id)?.count || 0;
        const countB = personaStats.find(s => s.id === b.id)?.count || 0;
        return countB - countA;
      });
    } else if (method === 'newest') {
      // Sort by ID timestamp for custom, static ones last
      sorted.sort((a, b) => {
        const isCustomA = a.id.startsWith('custom_');
        const isCustomB = b.id.startsWith('custom_');
        if (isCustomA && isCustomB) return b.id.localeCompare(a.id); // Newer timestamp first
        if (isCustomA) return -1;
        if (isCustomB) return 1;
        return 0;
      });
    }

    // Re-index order
    sorted.forEach((p, i) => p.order = i);
    setManagedPersonas(sorted);
    setIsOrderDirty(true);
  };

  const handleSaveOrder = async () => {
    try {
      const updates = managedPersonas.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        cover: p.cover,
        prompt: p.prompt,
        is_visible: p.isVisible,
        display_order: p.order
      }));

      const { error } = await supabase
        .from('discovered_personas')
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;
      
      toast.success('Order saved successfully');
      setIsOrderDirty(false);
      // Reset to manual sort as we've now saved a custom order
      setSortMethod('manual');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
    }
  };

  const handleMagicAdd = async () => {
    if (!magicName) return;

    setIsAnalyzing(true);
    try {
      console.log("Invoking analyze-persona with name:", magicName);
      
      const { data, error } = await supabase.functions.invoke('analyze-persona', {
        body: { name: magicName }
      });

      if (error) {
        // Try to parse the error body if available
        let details = '';
        if (error instanceof Error) {
            details = error.message;
        }
        // If it's a FunctionsHttpError, it might have context
        console.error("Full Error Object:", error);
        throw new Error(`Function failed: ${details || 'Unknown error'}`);
      }

      console.log("Analysis Result:", data);

      if (!data || !data.name || !data.prompt) {
          throw new Error("Invalid response from AI");
      }

      // Close magic modal
      setIsMagicAddOpen(false);
      setMagicName('');

      // Open editor with pre-filled data
      setEditingPersona({
        id: '', // Will be generated on save
        name: data.name,
        category: data.category,
        prompt: data.prompt,
        // Use a solid color placeholder
        cover: `https://placehold.co/400x600/${(data.color || '000000').replace('#', '')}/FFFFFF/png?text=${encodeURIComponent(data.name)}`,
        order: 999,
        isVisible: true,
      } as ManagedPersona);
      setIsNewPersona(true);
      setIsEditorOpen(true);
      
      toast.success('Persona profile generated! Review and save.');
    } catch (error: any) {
      console.error('Error analyzing persona:', error);
      toast.error(`Failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter users by search
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter personas by search
  const filteredPersonas = managedPersonas.filter(p =>
    p.name.toLowerCase().includes(personaSearchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(personaSearchQuery.toLowerCase())
  );

  // Loading state
  if (authLoading || (isAdmin && loading)) {
    return (
      <div className="min-h-screen w-full bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zinc-800 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen w-full bg-[#09090b]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-zinc-500 text-xs">PosterMe Management Console</p>
              </div>
            </div>
            
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-zinc-800/50 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'generations', label: 'Generations', icon: '🎨' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'manage-personas', label: 'Manage Personas', icon: '🎬' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 sm:px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                subtitle="Registered accounts"
                color="blue"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              />
              <StatCard
                title="Total Generations"
                value={stats.totalGenerations}
                subtitle={`${stats.generationsToday} today`}
                color="green"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />
              <StatCard
                title="Credits Remaining"
                value={stats.totalCreditsRemaining}
                subtitle="Across all users"
                color="yellow"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <StatCard
                title="Avg. Per User"
                value={stats.avgGenerationsPerUser.toFixed(1)}
                subtitle="Generations per user"
                color="purple"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">📈 Activity Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Generations Today</span>
                    <span className="text-white font-bold">{stats.generationsToday}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Generations This Week</span>
                    <span className="text-white font-bold">{stats.generationsThisWeek}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Est. API Cost</span>
                    <span className="text-amber-400 font-bold">${(stats.totalCreditsConsumed * 0.02).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">🎬 Top 5 Personas</h3>
                <PersonaBarChart data={personaStats.slice(0, 5)} />
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">⚡ Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setActiveTab('users')}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors"
                >
                  Manage Users
                </button>
                <button 
                  onClick={() => setActiveTab('manage-personas')}
                  className="px-4 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-lg text-sm font-medium transition-colors"
                >
                  Manage Personas
                </button>
                <button 
                  onClick={() => {
                    const csv = [
                      ['Email', 'Credits', 'Unlimited', 'Generations', 'Joined'].join(','),
                      ...users.map(u => [u.email, u.credits, u.is_unlimited, u.generation_count, u.created_at].join(','))
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `posterme-users-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    toast.success('Users exported to CSV');
                  }}
                  className="px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg text-sm font-medium transition-colors"
                >
                  Export Users CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by email or user ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <span className="text-zinc-500 text-sm">{filteredUsers.length} users</span>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-zinc-500">No users found</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onAddCredits={handleAddCredits}
                    onToggleUnlimited={handleToggleUnlimited}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Generations Tab */}
        {activeTab === 'generations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Recent Generations</h2>
              <span className="text-zinc-500 text-sm">{generations.length} total</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {generations.slice(0, 50).map((gen) => (
                <div 
                  key={gen.id}
                  className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden group"
                >
                  <div className="aspect-[2/3] relative">
                    <img 
                      src={gen.image_url} 
                      alt={gen.persona_name}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-white font-medium text-sm truncate">{gen.persona_name}</p>
                    <p className="text-zinc-500 text-xs truncate">{gen.user_email}</p>
                    <p className="text-zinc-600 text-xs mt-1">
                      {new Date(gen.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {generations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-500">No generations yet</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab (formerly Personas stats) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">📈 Persona Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">🏆 Most Popular Personas</h3>
                <PersonaBarChart data={personaStats} />
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">📊 Usage Distribution</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {personaStats.map((stat, index) => {
                    const persona = managedPersonas.find(p => p.id === stat.id);
                    return (
                      <div 
                        key={stat.id}
                        className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-500 text-sm w-6">#{index + 1}</span>
                          {persona && (
                            <img 
                              src={persona.cover} 
                              alt={persona.name}
                              className="w-8 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="text-white text-sm font-medium">{stat.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{stat.count}</p>
                          <p className="text-zinc-500 text-xs">{stat.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Unused Personas */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4">😴 Unused Personas</h3>
              <div className="flex flex-wrap gap-3">
                {managedPersonas
                  .filter(p => !personaStats.find(s => s.id === p.id))
                  .map(persona => (
                    <div key={persona.id} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 rounded-lg">
                      <img 
                        src={persona.cover} 
                        alt={persona.name}
                        className="w-6 h-8 object-cover rounded"
                      />
                      <span className="text-zinc-400 text-sm">{persona.name}</span>
                    </div>
                  ))
                }
                {managedPersonas.filter(p => !personaStats.find(s => s.id === p.id)).length === 0 && (
                  <p className="text-zinc-500 text-sm">All personas have been used! 🎉</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manage Personas Tab */}
        {activeTab === 'manage-personas' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">🎬 Manage Personas</h2>
                <p className="text-zinc-500 text-sm">Drag to reorder, click to edit</p>
              </div>
              <div className="flex items-center gap-3">
                {isOrderDirty && (
                  <button
                    onClick={handleSaveOrder}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2 animate-pulse"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Order
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingPersona(null);
                    setIsNewPersona(true);
                    setIsEditorOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New
                </button>
                <button
                  onClick={() => setIsMagicAddOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-purple-500/25"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Magic Add
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Sort Controls */}
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                {[
                  { id: 'manual', label: 'Manual' },
                  { id: 'alpha', label: 'A-Z' },
                  { id: 'popular', label: 'Popular' },
                  { id: 'newest', label: 'Newest' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => handleSortChange(method.id as any)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      sortMethod === method.id
                        ? 'bg-zinc-700 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search personas..."
                  value={personaSearchQuery}
                  onChange={(e) => setPersonaSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              {['All', 'Movie', 'Series', 'YouTube', 'Other'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setPersonaSearchQuery(cat === 'All' ? '' : cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    (cat === 'All' && !personaSearchQuery) || personaSearchQuery.toLowerCase() === cat.toLowerCase()
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Personas List */}
            <div className="space-y-2">
              {filteredPersonas.map((persona, index) => (
                <DraggablePersonaCard
                  key={persona.id}
                  persona={persona}
                  index={index}
                  stat={personaStats.find(s => s.id === persona.id)}
                  onEdit={() => {
                    setEditingPersona(persona);
                    setIsNewPersona(false);
                    setIsEditorOpen(true);
                  }}
                  onDelete={() => handleDeletePersona(persona.id)}
                  onToggleVisibility={() => handleTogglePersonaVisibility(persona)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  isDragging={dragIndex === index}
                  isDragTarget={dragOverIndex === index && sortMethod === 'manual'}
                />
              ))}
            </div>

            {filteredPersonas.length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-500">No personas found</p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <span className="text-zinc-500 text-sm">
                {managedPersonas.filter(p => p.isVisible).length} visible • {managedPersonas.filter(p => !p.isVisible).length} hidden
              </span>
              <span className="text-zinc-500 text-sm">
                {managedPersonas.length} total personas
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Persona Editor Modal */}
      <PersonaEditorModal
        persona={editingPersona}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingPersona(null);
          setIsNewPersona(false);
        }}
        onSave={handleSavePersona}
        isNew={isNewPersona}
      />

      {/* Magic Add Modal */}
      {isMagicAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsMagicAddOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Magic Add Persona</h2>
              <p className="text-zinc-400 text-sm">Enter a movie, series, or character name and we'll generate the details.</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={magicName}
                onChange={(e) => setMagicName(e.target.value)}
                placeholder="e.g. Iron Man, Game of Thrones..."
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleMagicAdd()}
              />
              
              <button
                onClick={handleMagicAdd}
                disabled={!magicName || isAnalyzing}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Generate Profile'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
