import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Clock, 
  ChefHat, 
  Utensils,
  Volume2, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  History, 
  Heart, 
  Share2,
  Filter,
  Loader2,
  Play,
  LogIn,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Lock,
  Star,
  LogOut
} from 'lucide-react';
import { Recipe, Ingredient, UserPreferences } from './types';
import { detectIngredients, generateRecipes, generateSpeech } from './services/geminiService';
import { cn } from './lib/utils';

function pcmToWav(pcmBase64: string, sampleRate: number = 24000): string {
  const pcmData = Uint8Array.from(atob(pcmBase64), c => c.charCodeAt(0));
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + pcmData.length, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, pcmData.length, true);

  const blob = new Blob([wavHeader, pcmData], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}
const getPasswordStrength = (password: string) => {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "text-red-500" };
  if (score <= 3) return { label: "Medium", color: "text-yellow-500" };
  return { label: "Strong", color: "text-green-500" };
};

export default function App() {
  const [step, setStep] = useState<'home' | 'detecting' | 'ingredients' | 'recipes' | 'detail' | 'history' | 'cooking' | 'favorites' | 'explore'>('home');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectedIngredients, setDetectedIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [loginForm, setLoginForm] = useState({ 
  username: '', 
  email: '', 
  password: '', 
  confirmPassword: '' 
  });
  const passwordStrength = getPasswordStrength(loginForm.password);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [newIngredient, setNewIngredient] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);

  const loadingMessages = [
    "Our AI is finding all the hidden treasures!",
    "Identifying yummy ingredients...",
    "Thinking of the best recipes for you...",
    "Almost there! Just a few more seconds...",
    "Consulting with our digital master chef...",
    "Polishing the cooking instructions..."
  ];

useEffect(() => {
  let interval: NodeJS.Timeout;
  if (step === 'detecting' || (step === 'ingredients' && loading)) {
    interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);
  }
  return () => clearInterval(interval);
}, [step, loading]);

useEffect(() => {
  fetch("http://localhost:5000/api/visit")
    .then(res => res.json())
    .then(data => setVisitorCount(data.count))
    .catch(err => console.error("Visitor count error:", err));
}, []);

const [preferences, setPreferences] = useState<UserPreferences>({
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [history, setHistory] = useState<Recipe[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const NON_VEGAN_KEYWORDS = [
    'meat', 'chicken', 'beef', 'pork', 'lamb', 'fish', 'egg', 'milk', 'cheese', 
    'butter', 'cream', 'yogurt', 'honey', 'bacon', 'ham', 'steak', 'salmon', 
    'shrimp', 'prawn', 'crab', 'lobster', 'turkey', 'duck', 'goose', 'venison', 
    'veal', 'mutton', 'sausage', 'pepperoni', 'salami', 'prosciutto', 'pancetta', 
    'chorizo', 'gelatin', 'lard', 'tallow', 'whey', 'casein', 'lactose', 'nonveg', 'non-veg'
  ];

  const isVeganPossible = () => {
    return !detectedIngredients.some(ing => 
      NON_VEGAN_KEYWORDS.some(keyword => ing.name.toLowerCase().includes(keyword))
    );
  };

  useEffect(() => {
    if (!isVeganPossible() && preferences.dietaryRestrictions.includes('Vegan')) {
      setPreferences(prev => ({
        ...prev,
        dietaryRestrictions: prev.dietaryRestrictions.filter(p => p !== 'Vegan')
      }));
    }
  }, [detectedIngredients]);

  useEffect(() => {
    const savedUser = localStorage.getItem('snap2serve_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setHistory([]);
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user/data?username=${user.username}`);
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.favorites || []);
          setHistory(data.history || []);
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };

    fetchUserData();
  }, [user]);

  const toggleFavorite = async (recipe: Recipe) => {
    if (!recipe || !recipe.id) return;
    if (!user) {
      alert("Please login to save favorites! 💖");
      setIsLoginOpen(true);
      return;
    }

    try {
      const response = await fetch("/api/user/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, recipe }),
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites);
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  const addToHistory = async (recipe: Recipe) => {
    if (!user) return;

    try {
      const response = await fetch("/api/user/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, recipe }),
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Failed to add to history", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      setStep('detecting');
      setLoading(true);
      
      try {
        const detected = await detectIngredients(base64);
        if (detected.length === 0) {
          alert("We couldn't find any ingredients in that photo. Try another one! 🍎🥦");
          setStep('home');
          return;
        }
        setDetectedIngredients(detected);
        setStep('ingredients');
      } catch (error) {
        console.error(error);
        alert("Failed to detect ingredients. Please try again.");
        setStep('home');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateRecipes = async () => {
    setLoading(true);
    try {
      const ingredientNames = detectedIngredients.map(i => i.name);
      const generated = await generateRecipes(ingredientNames, preferences);
      setRecipes(generated);
      setStep('recipes');
    } catch (error) {
      console.error(error);
      alert("Failed to generate recipes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Select a nice voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-US') && (v.name.includes('Google') || v.name.includes('Premium'))) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4"
    >
      <div className="mb-8 relative">
        <div className="absolute -inset-4 bg-cute-yellow rounded-full blur-3xl opacity-50 animate-pulse" />
        <ChefHat className="w-24 h-24 text-cute-pink relative z-10" />
      </div>
      <h1 className="text-6xl md:text-8xl font-display mb-6 tracking-tight text-cute-pink">Snap2Serve</h1>
      <p className="text-lg font-semibold text-gray-600 mt-2">
  👀 Visitors: {visitorCount}
</p>
      <p className="text-xl md:text-2xl text-brand-600 max-w-2xl mb-12 font-display italic">
        Turn your ingredients into yummy masterpieces with AI! Just snap a photo and start cooking.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 bg-cute-pink text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg hover:shadow-cute-pink/30"
        >
          <Camera className="w-6 h-6" />
          Snap & Cook!
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl">
        <div className="p-8 bg-white rounded-[2.5rem] border-4 border-cute-pink/20 shadow-sm hover:border-cute-pink/40 transition-colors">
          <div className="w-12 h-12 bg-cute-pink/10 rounded-2xl flex items-center justify-center mb-4">
            <Upload className="w-6 h-6 text-cute-pink" />
          </div>
          <h3 className="text-2xl font-display mb-2">1. Upload</h3>
          <p className="text-brand-600 text-sm">Take a photo of your yummy ingredients!</p>
        </div>
        <div className="p-8 bg-white rounded-[2.5rem] border-4 border-cute-mint/20 shadow-sm hover:border-cute-mint/40 transition-colors">
          <div className="w-12 h-12 bg-cute-mint/10 rounded-2xl flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-cute-mint" />
          </div>
          <h3 className="text-2xl font-display mb-2">2. Set Time</h3>
          <p className="text-brand-600 text-sm">How fast do you want to eat? 🕒</p>
        </div>
        <div className="p-8 bg-white rounded-[2.5rem] border-4 border-cute-blue/20 shadow-sm hover:border-cute-blue/40 transition-colors">
          <div className="w-12 h-12 bg-cute-blue/10 rounded-2xl flex items-center justify-center mb-4">
            <Utensils className="w-6 h-6 text-cute-blue" />
          </div>
          <h3 className="text-2xl font-display mb-2">3. Cook</h3>
          <p className="text-brand-600 text-sm">Get fun recipes and start your cooking adventure!</p>
        </div>
      </div>
    </motion.div>
  );

  const renderDetecting = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative w-64 h-64 mb-8">
        {selectedImage && (
          <img src={selectedImage} alt="Detecting" className="w-full h-full object-cover rounded-[3rem] opacity-50" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-16 h-16 text-cute-pink animate-spin" />
        </div>
        <div className="absolute inset-x-0 top-0 h-2 bg-cute-pink rounded-full blur-sm animate-[scan_2s_ease-in-out_infinite]" />
      </div>
      <h2 className="text-4xl font-display mb-2 text-cute-pink">Magical Analysis...</h2>
      <p className="text-brand-600 font-medium h-6">{loadingMessages[loadingMessageIndex]}</p>
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );

  const renderIngredients = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setStep('home')} className="p-3 bg-white hover:bg-cute-pink/10 rounded-2xl transition-colors shadow-sm">
          <ArrowLeft className="w-6 h-6 text-cute-pink" />
        </button>
        <h2 className="text-4xl font-display text-cute-pink">Look what we found! ✨</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
          <img src={selectedImage!} alt="Uploaded" className="w-full h-full object-cover aspect-square" />
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border-4 border-cute-mint/20 shadow-sm">
            <h3 className="text-2xl font-display mb-4 flex items-center gap-2 text-cute-mint">
              <Utensils className="w-6 h-6" />
              Your Ingredients
            </h3>
            <div className="flex flex-wrap gap-2">
              {detectedIngredients.map((ing, i) => (
                <span key={i} className="px-5 py-2 bg-cute-mint/10 text-brand-800 rounded-full text-sm font-bold flex items-center gap-2 border border-cute-mint/30">
                  {ing.name}
                  <button 
                    onClick={() => setDetectedIngredients(detectedIngredients.filter((_, idx) => idx !== i))}
                    className="hover:text-cute-pink transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
              {showAddInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newIngredient.trim()) {
                        setDetectedIngredients([...detectedIngredients, { name: newIngredient.trim(), confidence: 1 }]);
                        setNewIngredient('');
                        setShowAddInput(false);
                      }
                    }}
                    placeholder="Type ingredient..."
                    className="px-4 py-2 border-2 border-cute-pink rounded-full text-sm font-bold focus:outline-none"
                    autoFocus
                  />
                  <button 
                    onClick={() => setShowAddInput(false)}
                    className="p-2 bg-cute-pink/10 text-cute-pink rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAddInput(true)}
                  className="px-5 py-2 border-2 border-dashed border-brand-200 text-brand-400 rounded-full text-sm font-bold hover:border-cute-pink hover:text-cute-pink transition-colors"
                >
                  + Add more
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border-4 border-cute-yellow/40 shadow-sm">
            <h3 className="text-2xl font-display mb-4 flex items-center gap-2 text-brand-800">
              <Filter className="w-6 h-6" />
              Cooking Magic
            </h3>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-bold text-brand-500 mb-2 block">How much time? ⏰</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="10" 
                    max="120" 
                    step="5"
                    value={preferences.maxTime}
                    onChange={(e) => setPreferences({...preferences, maxTime: parseInt(e.target.value)})}
                    className="flex-1 accent-cute-pink h-2 bg-brand-100 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="font-display text-2xl min-w-[70px] text-cute-pink">{preferences.maxTime}m</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-bold text-brand-500 mb-2 block">Special Requests? 🥗</label>
                <div className="flex flex-wrap gap-2">
                  {['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto']
                    .filter(pref => pref !== 'Vegan' || isVeganPossible())
                    .map(pref => (
                    <button
                      key={pref}
                      onClick={() => {
                        const current = preferences.dietaryRestrictions;
                        setPreferences({
                          ...preferences,
                          dietaryRestrictions: current.includes(pref) ? current.filter(p => p !== pref) : [...current, pref]
                        });
                      }}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold border-2 transition-all",
                        preferences.dietaryRestrictions.includes(pref) 
                          ? "bg-cute-pink text-white border-cute-pink shadow-md" 
                          : "bg-white text-brand-600 border-brand-100 hover:border-cute-pink/40"
                      )}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-brand-500 mb-2 block">Cuisine Style? 🌎</label>
                <div className="flex flex-wrap gap-2">
                  {['Any', 'Mexican', 'Indian', 'Italian', 'Chinese', 'Japanese'].map(cuisine => (
                    <button
                      key={cuisine}
                      onClick={() => setPreferences({ ...preferences, cuisine: cuisine === 'Any' ? undefined : cuisine })}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold border-2 transition-all",
                        (preferences.cuisine === cuisine || (cuisine === 'Any' && !preferences.cuisine))
                          ? "bg-cute-blue text-white border-cute-blue shadow-md" 
                          : "bg-white text-brand-600 border-brand-100 hover:border-cute-blue/40"
                      )}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleGenerateRecipes}
            disabled={loading}
            className="w-full bg-cute-pink text-white py-5 rounded-full font-bold text-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg shadow-cute-pink/20"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ChefHat className="w-6 h-6" />}
            Make Magic Recipes!
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderRecipes = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <button onClick={() => setStep('ingredients')} className="p-3 bg-white hover:bg-cute-pink/10 rounded-2xl transition-colors shadow-sm">
            <ArrowLeft className="w-6 h-6 text-cute-pink" />
          </button>
          <h2 className="text-4xl font-display text-cute-pink">Yummy Choices! 😋</h2>
        </div>
        <div className="text-brand-500 text-sm font-display italic">
          Found {recipes.length} fun recipes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {recipes.map((recipe) => (
          <motion.div 
            key={recipe.id}
            whileHover={{ y: -12, scale: 1.02 }}
            className="bg-white rounded-[2.5rem] overflow-hidden border-4 border-white shadow-lg hover:shadow-2xl transition-all cursor-pointer flex flex-col group"
            onClick={() => {
              setSelectedRecipe(recipe);
              addToHistory(recipe);
              setStep('detail');
            }}
          >
            <div className="h-56 bg-brand-100 relative overflow-hidden">
              <img 
                src={`https://picsum.photos/seed/${recipe.id}/600/400`} 
                alt={recipe.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(recipe);
                  }}
                  className="p-3 bg-white/90 backdrop-blur-sm rounded-2xl hover:bg-white transition-colors shadow-sm"
                >
                  <Heart className={cn("w-6 h-6", favorites.some(f => f.id === recipe.id) ? "fill-cute-pink text-cute-pink" : "text-brand-950")} />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 flex gap-2">
                <span className="px-4 py-1.5 bg-cute-blue text-white text-[10px] uppercase tracking-widest font-bold rounded-full shadow-sm">
                  {recipe.cuisine}
                </span>
                <span className="px-4 py-1.5 bg-cute-pink text-white text-[10px] uppercase tracking-widest font-bold rounded-full shadow-sm">
                  {recipe.difficulty}
                </span>
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-2xl font-display mb-3 leading-tight text-brand-900">{recipe.title}</h3>
              <p className="text-brand-600 text-sm mb-6 line-clamp-2 flex-1 leading-relaxed">{recipe.description}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-brand-50">
                <div className="flex items-center gap-2 text-cute-pink font-bold">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">{recipe.cookingTime}m</span>
                </div>
                {recipe.calories && (
                  <div className="flex items-center gap-2 text-cute-yellow font-bold">
                    <span className="text-sm">{recipe.calories} kcal</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-cute-mint font-bold">
                  <Utensils className="w-5 h-5" />
                  <span className="text-sm">{recipe.ingredients.length} items</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderDetail = () => {
    if (!selectedRecipe) return null;
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto px-4 py-8"
      >
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setStep('recipes')} className="flex items-center gap-2 text-brand-600 hover:text-cute-pink font-bold transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to yummy list
          </button>
          <div className="flex gap-3">
            <button className="p-3 bg-white hover:bg-cute-pink/10 rounded-2xl transition-colors shadow-sm">
              <Share2 className="w-5 h-5 text-cute-pink" />
            </button>
            <button 
              onClick={() => toggleFavorite(selectedRecipe)}
              className="p-3 bg-white hover:bg-cute-pink/10 rounded-2xl transition-colors shadow-sm"
            >
              <Heart className={cn("w-5 h-5", favorites.some(f => f.id === selectedRecipe.id) ? "fill-cute-pink text-cute-pink" : "text-brand-950")} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="relative h-[450px] rounded-[3.5rem] overflow-hidden mb-10 shadow-2xl border-8 border-white">
              <img 
                src={`https://picsum.photos/seed/${selectedRecipe.id}/1200/800`} 
                alt={selectedRecipe.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-12">
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedRecipe.dietaryInfo.map(info => (
                      <span key={info} className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-bold rounded-full border border-white/30">
                        {info}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-5xl md:text-7xl text-white font-display leading-tight drop-shadow-lg">{selectedRecipe.title}</h1>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <h3 className="text-4xl font-display mb-8 flex items-center gap-4 text-brand-900">
                How to make it 👩‍🍳
                <button 
                  onClick={() => handleSpeak(selectedRecipe.instructions.join(". "))}
                  className={cn(
                    "p-3 rounded-2xl transition-all shadow-md",
                    isSpeaking ? "bg-cute-pink text-white animate-pulse" : "bg-white text-cute-pink hover:bg-cute-pink/10"
                  )}
                >
                  <Volume2 className="w-6 h-6" />
                </button>
              </h3>
              <div className="space-y-10">
                {selectedRecipe.instructions.map((step, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-cute-pink/10 text-cute-pink flex items-center justify-center font-display text-2xl group-hover:bg-cute-pink group-hover:text-white transition-all shadow-sm">
                      {i + 1}
                    </div>
                    <div className="pt-1">
                      <p className="text-xl text-brand-800 leading-relaxed font-medium">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border-4 border-cute-mint/20 shadow-sm">
              <h3 className="text-3xl font-display mb-8 text-cute-mint">What you need 🧺</h3>
              <ul className="space-y-5">
                {selectedRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center gap-4 text-brand-700 font-bold">
                    <div className="w-2.5 h-2.5 rounded-full bg-cute-mint shadow-sm" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-cute-pink text-white p-10 rounded-[3rem] shadow-2xl shadow-cute-pink/20">
              <h3 className="text-3xl font-display mb-8">Quick Stats 📊</h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-80 font-bold block mb-2">Time</label>
                  <div className="text-3xl font-display">{selectedRecipe.cookingTime}m</div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-80 font-bold block mb-2">Difficulty</label>
                  <div className="text-3xl font-display">{selectedRecipe.difficulty}</div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest opacity-80 font-bold block mb-2">Cuisine</label>
                  <div className="text-3xl font-display">{selectedRecipe.cuisine}</div>
                </div>
                {selectedRecipe.calories && (
                  <div>
                    <label className="text-[10px] uppercase tracking-widest opacity-80 font-bold block mb-2">Calories</label>
                    <div className="text-3xl font-display">{selectedRecipe.calories}</div>
                  </div>
                )}
              </div>
              <button 
                onClick={() => {
                  setCurrentStepIndex(0);
                  setStep('cooking');
                }}
                className="w-full mt-10 bg-white text-cute-pink py-5 rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg"
              >
                <Play className="w-5 h-5" />
                Start Cooking!
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderCooking = () => {
    if (!selectedRecipe) return null;
    const currentStep = selectedRecipe.instructions[currentStepIndex];
    const progress = ((currentStepIndex + 1) / selectedRecipe.instructions.length) * 100;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto px-4 py-8"
      >
        <div className="flex items-center justify-between mb-12">
          <button onClick={() => setStep('detail')} className="p-3 bg-white hover:bg-cute-pink/10 rounded-2xl transition-colors shadow-sm">
            <ArrowLeft className="w-6 h-6 text-cute-pink" />
          </button>
          <div className="flex-1 mx-8">
            <div className="h-3 bg-brand-100 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-cute-pink shadow-[0_0_10px_rgba(255,107,157,0.5)]"
              />
            </div>
            <p className="text-center text-brand-500 font-bold mt-3 text-sm uppercase tracking-widest">
              Step {currentStepIndex + 1} of {selectedRecipe.instructions.length}
            </p>
          </div>
          <div className="w-12" />
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              className="bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl border-8 border-cute-pink/10 min-h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-cute-pink/20" />
              
              <div className="mb-10">
                <div className="w-20 h-20 bg-cute-pink/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <ChefHat className="w-10 h-10 text-cute-pink" />
                </div>
                <h3 className="text-3xl md:text-5xl font-display text-brand-950 leading-tight">
                  {currentStep}
                </h3>
              </div>

              <button 
                onClick={() => handleSpeak(currentStep)}
                className={cn(
                  "p-6 rounded-3xl transition-all shadow-xl hover:scale-110",
                  isSpeaking ? "bg-cute-pink text-white animate-pulse" : "bg-brand-50 text-cute-pink hover:bg-cute-pink/10"
                )}
              >
                <Volume2 className="w-8 h-8" />
              </button>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-12 gap-6">
            <button
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex(prev => prev - 1)}
              className="flex-1 bg-white text-brand-600 py-6 rounded-[2rem] font-bold text-xl flex items-center justify-center gap-3 hover:bg-brand-50 transition-all disabled:opacity-30 shadow-lg border-4 border-brand-100"
            >
              <ChevronLeft className="w-6 h-6" />
              Previous
            </button>
            
            {currentStepIndex === selectedRecipe.instructions.length - 1 ? (
              <button
                onClick={() => setShowRating(true)}
                className="flex-1 bg-cute-mint text-white py-6 rounded-[2rem] font-bold text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-cute-mint/20"
              >
                <CheckCircle2 className="w-6 h-6" />
                Finish Cooking!
              </button>
            ) : (
              <button
                onClick={() => setCurrentStepIndex(prev => prev + 1)}
                className="flex-1 bg-cute-pink text-white py-6 rounded-[2rem] font-bold text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-lg shadow-cute-pink/20"
              >
                Next Step
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showRating && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-brand-950/60 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white w-full max-w-md rounded-[4rem] p-12 text-center shadow-2xl border-8 border-white"
              >
                <div className="w-24 h-24 bg-cute-yellow/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Star className="w-12 h-12 text-cute-yellow fill-cute-yellow" />
                </div>
                <h2 className="text-4xl font-display text-brand-950 mb-4">Yum! How was it?</h2>
                <p className="text-brand-500 font-medium mb-10">Rate your masterpiece! 👩‍🍳✨</p>
                
                <div className="flex justify-center gap-3 mb-12">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      className="transition-transform hover:scale-125"
                    >
                      <Star 
                        className={cn(
                          "w-12 h-12 transition-colors",
                          rating >= s ? "text-cute-yellow fill-cute-yellow" : "text-brand-100"
                        )} 
                      />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    alert(`Thanks for the ${rating} star rating! 💖`);
                    setShowRating(false);
                    setRating(0);
                    setStep('detail');
                  }}
                  className="w-full bg-cute-pink text-white py-5 rounded-3xl font-bold text-xl shadow-lg shadow-cute-pink/20 hover:scale-[1.02] transition-all"
                >
                  Save & Finish
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderLoginModal = () => (
    <AnimatePresence>
      {isLoginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsLoginOpen(false);
              setIsSignup(false);
            }}
            className="absolute inset-0 bg-brand-950/40 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl overflow-hidden border-8 border-white"
          >
            <div className="absolute top-0 left-0 w-full h-3 bg-cute-pink" />
            <button 
              onClick={() => {
                setIsLoginOpen(false);
                setIsSignup(false);
              }}
              className="absolute top-6 right-6 p-2 hover:bg-brand-50 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-brand-400" />
            </button>

            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-cute-pink/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ChefHat className="w-10 h-10 text-cute-pink" />
              </div>
              <h2 className="text-4xl font-display text-brand-950 mb-2">
                {isSignup ? "Join Us! 🌈" : "Welcome Back!"}
              </h2>
              <p className="text-brand-500 font-medium">
                {isSignup ? "Create your chef profile ✨" : "Join the Snap2Serve family 🌈"}
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-800 ml-2">
                  {isSignup ? "Username" : "Username or Email"}
                </label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-300" />
                  <input 
                    type="text" 
                    placeholder={isSignup ? "ChefYummy" : "ChefYummy or hello@yummy.com"}
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-brand-50 border-2 border-transparent focus:border-cute-pink focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {isSignup && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-brand-800 ml-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-300" />
                    <input 
                      type="email" 
                      placeholder="hello@yummy.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-brand-50 border-2 border-transparent focus:border-cute-pink focus:bg-white rounded-2xl outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-800 ml-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-300" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full pl-14 pr-6 py-4 bg-brand-50 border-2 border-transparent focus:border-cute-pink focus:bg-white rounded-2xl outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* ✅ ADD THIS BELOW PASSWORD */}
{isSignup && (
  <div className="space-y-2">
    <label className="text-sm font-bold text-brand-800 ml-2">Confirm Password</label>
    <div className="relative">
      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-300" />
      <input 
        type="password"
        value={loginForm.confirmPassword}
        onChange={(e) => setLoginForm({...loginForm, confirmPassword: e.target.value})}
      />
    </div>

    {/* Match check */}
    {loginForm.confirmPassword && (
      <p className={`text-sm ml-2 ${
        loginForm.password === loginForm.confirmPassword 
          ? "text-green-500" 
          : "text-red-500"
      }`}>
        {loginForm.password === loginForm.confirmPassword 
          ? "Passwords match ✅" 
          : "Passwords do not match ❌"}
      </p>
    )}
  </div>
)}
              {loginForm.password && (
  <div className="mt-2 ml-2">
    <p className={`text-sm font-bold ${passwordStrength.color}`}>
      Strength: {passwordStrength.label}
    </p>
    <p className="text-xs text-gray-500">
      Must contain 8+ characters, uppercase, number & special symbol
    </p>
  </div>
)}

              <button 
                if (isSignup && loginForm.password !== loginForm.confirmPassword) {
  alert("Passwords do not match!");
  return;
}
                onClick={async () => {
                  const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
                  setAuthLoading(true);
                  try {
                    const response = await fetch(endpoint, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(loginForm),
                    });
                    const data = await response.json();
                    if (response.ok) {
                      setUser(data);
                      localStorage.setItem('snap2serve_user', JSON.stringify(data));
                      alert(`Welcome, ${data.username}! Happy cooking! 🍳✨`);
                      setIsLoginOpen(false);
                      setIsSignup(false);
                    } else {
                      alert(data.error || "Authentication failed. Please try again.");
                    }
                  } catch (error) {
                    console.error("Auth error", error);
                    alert("An error occurred during authentication.");
                  } finally {
                    setAuthLoading(false);
                  }
                }}
                disabled={authLoading}
                className="w-full bg-cute-pink text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-cute-pink/20 hover:scale-[1.02] transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {authLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSignup ? "Create Account" : "Sign In"}
              </button>

              <p className="text-center text-sm text-brand-400 font-medium">
                {isSignup ? "Already have an account?" : "Don't have an account?"} 
                <button 
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-cute-pink font-bold hover:underline ml-1"
                >
                  {isSignup ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderFavorites = () => {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto px-4 py-8"
      >
        <div className="flex items-center gap-4 mb-12">
          <button onClick={() => setStep('home')} className="p-3 bg-white hover:bg-cute-pink/10 rounded-2xl transition-colors shadow-sm">
            <ArrowLeft className="w-6 h-6 text-cute-pink" />
          </button>
          <h2 className="text-4xl font-display text-cute-pink">Your Favorites ❤️</h2>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-24">
            <Heart className="w-20 h-20 text-brand-200 mx-auto mb-6" />
            <p className="text-brand-500 font-display italic text-2xl">No favorites yet. Tap the heart on recipes you love! 💖</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {favorites.map((recipe) => (
              <motion.div 
                key={recipe.id}
                whileHover={{ y: -12, scale: 1.02 }}
                className="bg-white rounded-[2.5rem] overflow-hidden border-4 border-white shadow-lg hover:shadow-2xl transition-all cursor-pointer flex flex-col group"
                onClick={() => {
                  setSelectedRecipe(recipe);
                  setStep('detail');
                }}
              >
                <div className="h-48 bg-brand-100 relative overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${recipe.id}/600/400`} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(recipe);
                      }}
                      className="p-3 bg-white/90 backdrop-blur-sm rounded-2xl hover:bg-white transition-colors shadow-sm"
                    >
                      <Heart className={cn("w-6 h-6 fill-cute-pink text-cute-pink")} />
                    </button>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-display mb-3 leading-tight text-brand-900">{recipe.title}</h3>
                  <div className="flex items-center gap-4 text-brand-500 font-bold text-sm">
                    <span className="flex items-center gap-2 text-cute-pink"><Clock className="w-5 h-5" /> {recipe.cookingTime}m</span>
                    <span className="flex items-center gap-2 text-cute-blue"><Utensils className="w-5 h-5" /> {recipe.cuisine}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const renderExplore = () => {
    const cuisines = ['Mexican', 'Indian', 'Italian', 'Chinese', 'Japanese'];
    const recipeTemplates = [
      { 
        title: "Spicy {cuisine} Bowl", 
        time: 20, 
        cal: 350,
        desc: "A vibrant and spicy bowl packed with authentic {cuisine} flavors and fresh vegetables.",
        ingredients: ["Rice", "Spices", "Fresh Herbs", "Vegetables", "Secret Sauce"],
        instructions: ["Prepare the base ingredients", "Sauté with aromatic spices", "Garnish with fresh herbs", "Serve hot and enjoy!"]
      },
      { 
        title: "Creamy {cuisine} Delight", 
        time: 40, 
        cal: 520,
        desc: "Rich, creamy, and absolutely comforting. This {cuisine} classic is a crowd favorite.",
        ingredients: ["Cream", "Primary Protein", "Aromatic Base", "Butter", "Special Seasoning"],
        instructions: ["Slow cook the base", "Incorporate the creamy elements", "Simmer until perfect consistency", "Pair with your favorite side"]
      },
      { 
        title: "Classic {cuisine} Mix", 
        time: 30, 
        cal: 400,
        desc: "The perfect balance of traditional {cuisine} ingredients in one satisfying dish.",
        ingredients: ["Traditional Grains", "Seasonal Veggies", "House Blend Spices", "Olive Oil"],
        instructions: ["Prep all ingredients", "Combine in a large pan", "Cook over medium heat", "Season to taste"]
      },
      { 
        title: "Healthy {cuisine} Salad", 
        time: 15, 
        cal: 280,
        desc: "Light, refreshing, and full of nutrients. A modern take on {cuisine} healthy eating.",
        ingredients: ["Leafy Greens", "Crunchy Toppings", "Light Dressing", "Nuts", "Seeds"],
        instructions: ["Wash and dry the greens", "Whisk the dressing", "Toss everything together", "Serve immediately"]
      },
      { 
        title: "Grandma's {cuisine} Secret", 
        time: 50, 
        cal: 600,
        desc: "A time-honored recipe passed down through generations. Pure {cuisine} soul food.",
        ingredients: ["Heritage Ingredients", "Slow-cooked Broth", "Love", "Hand-picked Herbs"],
        instructions: ["Start the long simmer", "Add ingredients at precise intervals", "Let the flavors meld", "Serve with tradition"]
      },
      { 
        title: "Quick {cuisine} Stir-fry", 
        time: 25, 
        cal: 380,
        desc: "Fast, fresh, and flavorful. Perfect for a busy weeknight {cuisine} dinner.",
        ingredients: ["Wok-ready Veggies", "Soy Sauce", "Ginger", "Garlic", "Sesame Oil"],
        instructions: ["Heat the wok to high", "Flash fry the aromatics", "Add veggies and sauce", "Serve over rice"]
      },
      { 
        title: "Authentic {cuisine} Feast", 
        time: 45, 
        cal: 550,
        desc: "An elaborate spread of {cuisine} delicacies that will transport your taste buds.",
        ingredients: ["Premium Spices", "Fresh Produce", "Traditional Grains", "Artisanal Oils"],
        instructions: ["Prepare multiple components", "Layer the flavors carefully", "Cook to perfection", "Present beautifully"]
      },
      { 
        title: "Modern {cuisine} Fusion", 
        time: 35, 
        cal: 420,
        desc: "A creative blend of traditional {cuisine} techniques and contemporary ingredients.",
        ingredients: ["Fusion Elements", "Classic Base", "Exotic Spices", "Fresh Garnish"],
        instructions: ["Experiment with textures", "Balance the bold flavors", "Cook with precision", "Garnish creatively"]
      },
      { 
        title: "Midnight {cuisine} Snack", 
        time: 10, 
        cal: 250,
        desc: "The ultimate quick fix for your {cuisine} cravings. Simple yet delicious.",
        ingredients: ["Pantry Staples", "Quick Spices", "Leftover Magic", "Crispy Toppings"],
        instructions: ["Quick prep", "Heat and mix", "Add a crunch", "Enjoy your snack"]
      },
    ];

    const exploreRecipes = cuisines.flatMap(cuisine => 
      recipeTemplates.map((t, i) => ({
        id: `explore-${cuisine}-${i}`,
        title: t.title.replace(/{cuisine}/g, cuisine),
        cuisine,
        cookingTime: t.time + Math.floor(Math.random() * 10),
        calories: t.cal + Math.floor(Math.random() * 50),
        difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)] as any,
        description: t.desc.replace(/{cuisine}/g, cuisine),
        ingredients: t.ingredients,
        instructions: t.instructions,
        dietaryInfo: ['Healthy', cuisine]
      }))
    ).sort(() => Math.random() - 0.5);

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto px-4 py-8"
      >
        <div className="flex items-center gap-4 mb-12">
          <button onClick={() => setStep('home')} className="p-3 bg-white hover:bg-cute-pink/10 rounded-2xl transition-colors shadow-sm">
            <ArrowLeft className="w-6 h-6 text-cute-pink" />
          </button>
          <h2 className="text-4xl font-display text-cute-pink">Explore Trending Recipes 🌈</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exploreRecipes.map((item) => (
            <motion.div 
              key={item.id}
              whileHover={{ y: -10 }}
              className="bg-white rounded-[2.5rem] overflow-hidden border-4 border-white shadow-lg flex flex-col cursor-pointer group"
              onClick={() => {
                setSelectedRecipe(item as any);
                setStep('detail');
              }}
            >
              <div className="h-56 bg-brand-100 relative overflow-hidden">
                <img 
                  src={`https://picsum.photos/seed/${item.id}/600/400`} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4">
                  <div className="px-4 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-cute-pink shadow-sm">
                    {item.cuisine}
                  </div>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-display mb-3 leading-tight text-brand-900">{item.title}</h3>
                <p className="text-brand-600 text-sm mb-6 line-clamp-2 flex-1 leading-relaxed">{item.description}</p>
                <div className="flex items-center justify-between pt-6 border-t border-brand-50">
                  <div className="flex items-center gap-2 text-cute-pink font-bold">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm">{item.cookingTime}m</span>
                  </div>
                  <div className="flex items-center gap-2 text-cute-blue font-bold">
                    <Utensils className="w-5 h-5" />
                    <span className="text-sm">{item.ingredients.length} items</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderHistory = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto px-4 py-8"
    >
      <div className="flex items-center gap-4 mb-12">
        <button onClick={() => setStep('home')} className="p-3 bg-white hover:bg-cute-pink/10 rounded-2xl transition-colors shadow-sm">
          <ArrowLeft className="w-6 h-6 text-cute-pink" />
        </button>
        <h2 className="text-4xl font-display text-cute-pink">Your Yummy History 📖</h2>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-24">
          <History className="w-20 h-20 text-brand-200 mx-auto mb-6" />
          <p className="text-brand-500 font-display italic text-2xl">No yummy history yet. Let's cook something! 🍳</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {history.map((recipe) => (
            <motion.div 
              key={recipe.id}
              whileHover={{ y: -12, scale: 1.02 }}
              className="bg-white rounded-[2.5rem] overflow-hidden border-4 border-white shadow-lg hover:shadow-2xl transition-all cursor-pointer flex flex-col group"
              onClick={() => {
                setSelectedRecipe(recipe);
                setStep('detail');
              }}
            >
              <div className="h-48 bg-brand-100 relative overflow-hidden">
                <img 
                  src={`https://picsum.photos/seed/${recipe.id}/600/400`} 
                  alt={recipe.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(recipe);
                    }}
                    className="p-3 bg-white/90 backdrop-blur-sm rounded-2xl hover:bg-white transition-colors shadow-sm"
                  >
                    <Heart className={cn("w-6 h-6", favorites.some(f => f.id === recipe.id) ? "fill-cute-pink text-cute-pink" : "text-brand-950")} />
                  </button>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-display mb-3 leading-tight text-brand-900">{recipe.title}</h3>
                <div className="flex items-center gap-4 text-brand-500 font-bold text-sm">
                  <span className="flex items-center gap-2 text-cute-pink"><Clock className="w-5 h-5" /> {recipe.cookingTime}m</span>
                  <span className="flex items-center gap-2 text-cute-blue"><Utensils className="w-5 h-5" /> {recipe.cuisine}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-brand-50 selection:bg-brand-200">
      <nav className="px-6 py-8 max-w-7xl mx-auto flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setStep('home')}
        >
          <div className="w-12 h-12 bg-cute-pink rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-md">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-display font-bold tracking-tight text-cute-pink">Snap2Serve</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => setStep('home')}
            className={cn(
              "text-sm font-bold transition-colors",
              step === 'home' ? "text-cute-pink" : "text-brand-600 hover:text-cute-pink"
            )}
          >
            Home 🏠
          </button>
          <button 
            onClick={() => setStep('explore')}
            className={cn(
              "text-sm font-bold transition-colors",
              step === 'explore' ? "text-cute-pink" : "text-brand-600 hover:text-cute-pink"
            )}
          >
            Explore 🌈
          </button>
          <button 
            onClick={() => setStep('favorites')}
            className={cn(
              "text-sm font-bold transition-colors flex items-center gap-2",
              step === 'favorites' ? "text-cute-pink" : "text-brand-600 hover:text-cute-pink"
            )}
          >
            <Heart className={cn("w-4 h-4", favorites.length > 0 && "fill-cute-pink text-cute-pink")} />
            Favorites ({favorites.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg border-2 border-cute-pink/20"
            >
              <div className="w-10 h-10 bg-cute-pink rounded-xl flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Chef</span>
                <span className="text-sm font-bold text-brand-950 leading-none">{user.username}</span>
              </div>
              <button 
                onClick={() => {
                  setUser(null);
                  localStorage.removeItem('snap2serve_user');
                }}
                className="ml-4 p-2 hover:bg-cute-pink/10 rounded-xl text-brand-400 hover:text-cute-pink transition-all"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="w-12 h-12 rounded-2xl bg-cute-pink flex items-center justify-center hover:bg-cute-pink/80 transition-colors shadow-sm"
            >
              <LogIn className="w-6 h-6 text-white" />
            </button>
          )}
          <button 
            onClick={() => setStep('history')}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
              step === 'history' ? "bg-cute-yellow" : "bg-white hover:bg-cute-yellow/20"
            )}
          >
            <History className="w-6 h-6 text-brand-950" />
          </button>
        </div>
      </nav>

      {renderLoginModal()}

      <main className="pb-24">
        <AnimatePresence mode="wait">
          {step === 'home' && renderHome()}
          {step === 'detecting' && renderDetecting()}
          {step === 'ingredients' && renderIngredients()}
          {step === 'recipes' && renderRecipes()}
          {step === 'detail' && renderDetail()}
          {step === 'history' && renderHistory()}
          {step === 'favorites' && renderFavorites()}
          {step === 'explore' && renderExplore()}
          {step === 'cooking' && renderCooking()}
        </AnimatePresence>
      </main>

      <footer className="border-t border-brand-200 py-16 px-6 bg-white rounded-t-[4rem]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <ChefHat className="w-8 h-8 text-cute-pink" />
              <span className="text-2xl font-display font-bold text-cute-pink">Snap2Serve</span>
            </div>
            <p className="text-brand-600 max-w-sm font-display text-lg italic">
              Making cooking fun and easy for everyone! 🌈 Reducing food waste with a little bit of AI magic.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-brand-600">
              <li><a href="#" className="hover:text-brand-950 transition-colors">How it works</a></li>
              <li><a href="#" className="hover:text-brand-950 transition-colors">AI Technology</a></li>
              <li><a href="#" className="hover:text-brand-950 transition-colors">Mobile App</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-brand-600">
              <li><a href="#" className="hover:text-brand-950 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-brand-950 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-brand-950 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-brand-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-brand-400 font-medium">
          <p>© 2026 Snap2Serve AI. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-brand-950 transition-colors">Twitter</a>
            <a href="#" className="hover:text-brand-950 transition-colors">Instagram</a>
            <a href="#" className="hover:text-brand-950 transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}


