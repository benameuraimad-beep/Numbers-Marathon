/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Check, RotateCcw, Info, User, Settings, Trophy, Twitter, Facebook, Instagram, Flame, Snowflake } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types ---
type Difficulty = 'سهل' | 'متوسط' | 'صعب';
type GameMode = 'PvP' | 'PvAI' | null;
type AIMode = 'Easy' | 'Medium' | 'Impossible';
type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';

interface Question {
  num1: number;
  num2: number;
  answer: number;
  symbol: string;
}

interface PlayerState {
  score: number;
  currentQuestion: Question;
  input: string;
  isWrong: boolean;
  isCorrect: boolean;
  streak: number;
  hasUsedFreeze: boolean;
  isFrozen: boolean;
  isThinking?: boolean;
}

const TARGET_SCORE = 100;
const BASE_POINTS = 10;
const STREAK_POINTS = 15;
const STREAK_THRESHOLD = 3;

// --- Audio Helper ---
const playSound = (url: string) => {
  const audio = new Audio(url);
  audio.volume = 0.4;
  audio.play().catch(() => {}); // Ignore autoplay restrictions
};

const SOUNDS = {
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  CORRECT: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  WRONG: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  FREEZE: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
};

export default function App() {
  // --- Game State ---
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [selectedOperation, setSelectedOperation] = useState<MathOperation | null>(null);
  const [aiMode, setAiMode] = useState<AIMode>('Medium');
  const [difficulty, setDifficulty] = useState<Difficulty>('متوسط');
  const [player1, setPlayer1] = useState<PlayerState>(() => createInitialPlayerState('متوسط', 'multiplication'));
  const [player2, setPlayer2] = useState<PlayerState>(() => createInitialPlayerState('متوسط', 'multiplication'));
  const [winner, setWinner] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // --- Helpers ---
  function generateQuestion(diff: Difficulty, op: MathOperation): Question {
    let currentOp = op;
    if (op === 'mixed') {
      const ops: MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division'];
      currentOp = ops[Math.floor(Math.random() * ops.length)];
    }

    let num1 = 0, num2 = 0, answer = 0, symbol = '';

    switch (currentOp) {
      case 'addition':
        num1 = Math.floor(Math.random() * 100) + 1;
        num2 = Math.floor(Math.random() * 100) + 1;
        answer = num1 + num2;
        symbol = '+';
        break;
      case 'subtraction':
        num1 = Math.floor(Math.random() * 100) + 1;
        num2 = Math.floor(Math.random() * num1) + 1; // Ensure positive result
        answer = num1 - num2;
        symbol = '-';
        break;
      case 'multiplication':
        let multMax = 12;
        if (diff === 'سهل') multMax = 5;
        if (diff === 'صعب') multMax = 20;
        num1 = Math.floor(Math.random() * multMax) + 1;
        num2 = Math.floor(Math.random() * multMax) + 1;
        answer = num1 * num2;
        symbol = '×';
        break;
      case 'division':
        let divMax = 10;
        if (diff === 'صعب') divMax = 15;
        const divisor = Math.floor(Math.random() * divMax) + 1;
        const quotient = Math.floor(Math.random() * divMax) + 1;
        num1 = divisor * quotient;
        num2 = divisor;
        answer = quotient;
        symbol = '÷';
        break;
    }

    return { num1, num2, answer, symbol };
  }

  function createInitialPlayerState(diff: Difficulty, op: MathOperation): PlayerState {
    return {
      score: 0,
      currentQuestion: generateQuestion(diff, op),
      input: '',
      isWrong: false,
      isCorrect: false,
      streak: 0,
      hasUsedFreeze: false,
      isFrozen: false,
    };
  }

  const useFreeze = (playerNum: 1 | 2) => {
    if (winner) return;
    playSound(SOUNDS.FREEZE);
    
    if (playerNum === 1) {
      setPlayer1(prev => ({ ...prev, hasUsedFreeze: true }));
      setPlayer2(prev => ({ ...prev, isFrozen: true }));
      setTimeout(() => setPlayer2(prev => ({ ...prev, isFrozen: false })), 3000);
    } else {
      setPlayer2(prev => ({ ...prev, hasUsedFreeze: true }));
      setPlayer1(prev => ({ ...prev, isFrozen: true }));
      setTimeout(() => setPlayer1(prev => ({ ...prev, isFrozen: false })), 3000);
    }
  };

  const handleKeyPress = (playerNum: 1 | 2, key: string) => {
    if (winner) return;
    
    const currentPlayer = playerNum === 1 ? player1 : player2;
    if (currentPlayer.isFrozen) return;

    playSound(SOUNDS.CLICK);

    const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;

    setPlayer((prev) => {
      if (key === 'C') {
        return { ...prev, input: '' };
      }
      if (key === '=') {
        const isCorrect = parseInt(prev.input) === prev.currentQuestion.answer;
        if (isCorrect) {
          playSound(SOUNDS.CORRECT);
          const newStreak = prev.streak + 1;
          const points = newStreak >= STREAK_THRESHOLD ? STREAK_POINTS : BASE_POINTS;
          const newScore = prev.score + points;
          
          if (newScore >= TARGET_SCORE) {
            setWinner(playerNum);
            confetti({
              particleCount: 200,
              spread: 90,
              origin: { y: 0.5 },
              colors: playerNum === 1 ? ['#2563eb', '#ffffff', '#fbbf24'] : ['#ef4444', '#ffffff', '#fbbf24']
            });
          }
          return {
            ...prev,
            score: newScore,
            currentQuestion: generateQuestion(difficulty, selectedOperation || 'multiplication'),
            input: '',
            isWrong: false,
            isCorrect: true,
            streak: newStreak,
          };
        } else {
          playSound(SOUNDS.WRONG);
          return { ...prev, input: '', isWrong: true, isCorrect: false, streak: 0 };
        }
      }
      if (prev.input.length >= 4) return prev;
      return { ...prev, input: prev.input + key, isWrong: false, isCorrect: false };
    });
  };

  // --- AI Logic ---
  useEffect(() => {
    if (gameMode !== 'PvAI' || winner || player2.isFrozen || player2.isThinking) return;

    const solveQuestion = async () => {
      setPlayer2(prev => ({ ...prev, isThinking: true }));
      
      // AI Thinking Delay
      let delay = 1500;
      if (aiMode === 'Easy') delay = Math.floor(Math.random() * 2000) + 5000;
      if (aiMode === 'Medium') delay = Math.floor(Math.random() * 1000) + 3000;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      if (winner || player2.isFrozen) {
        setPlayer2(prev => ({ ...prev, isThinking: false }));
        return;
      }

      // Determine answer (Accuracy)
      let accuracy = 1;
      if (aiMode === 'Easy') accuracy = 0.7;
      if (aiMode === 'Medium') accuracy = 0.9;
      
      const isCorrect = Math.random() < accuracy;
      const targetAnswer = isCorrect 
        ? player2.currentQuestion.answer 
        : player2.currentQuestion.answer + (Math.random() > 0.5 ? 1 : -1);
      
      const answerStr = targetAnswer.toString();
      
      // Simulate Typing
      for (let i = 0; i < answerStr.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (winner || player2.isFrozen) break;
        setPlayer2(prev => ({ ...prev, input: prev.input + answerStr[i] }));
        playSound(SOUNDS.CLICK);
      }

      if (!winner && !player2.isFrozen) {
        await new Promise(resolve => setTimeout(resolve, 300));
        handleKeyPress(2, '=');
      }
      
      setPlayer2(prev => ({ ...prev, isThinking: false }));
    };

    solveQuestion();
  }, [player2.currentQuestion, gameMode, winner, player2.isFrozen]);

  // Reset feedback states
  useEffect(() => {
    if (player1.isWrong || player1.isCorrect) {
      const timer = setTimeout(() => setPlayer1(p => ({ ...p, isWrong: false, isCorrect: false })), 600);
      return () => clearTimeout(timer);
    }
  }, [player1.isWrong, player1.isCorrect]);

  useEffect(() => {
    if (player2.isWrong || player2.isCorrect) {
      const timer = setTimeout(() => setPlayer2(p => ({ ...p, isWrong: false, isCorrect: false })), 600);
      return () => clearTimeout(timer);
    }
  }, [player2.isWrong, player2.isCorrect]);

  const resetGame = () => {
    setPlayer1(createInitialPlayerState(difficulty, selectedOperation || 'multiplication'));
    setPlayer2(createInitialPlayerState(difficulty, selectedOperation || 'multiplication'));
    setWinner(null);
    setIsSidebarOpen(false);
    setGameMode(null);
    setSelectedOperation(null);
  };

  const changeDifficulty = (newDiff: Difficulty) => {
    setDifficulty(newDiff);
    setPlayer1(createInitialPlayerState(newDiff, selectedOperation || 'multiplication'));
    setPlayer2(createInitialPlayerState(newDiff, selectedOperation || 'multiplication'));
    setWinner(null);
    setIsSidebarOpen(false);
  };

  // --- Components ---
  const PlayerPanel = ({ player, playerNum, color, accentColor }: { player: PlayerState, playerNum: 1 | 2, color: string, accentColor: string }) => {
    const isAI = gameMode === 'PvAI' && playerNum === 2;
    
    return (
    <div className={`relative flex flex-col items-center justify-start h-full w-full p-4 md:p-8 pt-12 ${color} transition-all duration-500 overflow-y-auto custom-scrollbar ${player.isFrozen ? 'grayscale brightness-50' : ''}`}>
      {/* Feedback Overlays */}
      <AnimatePresence>
        {player.isWrong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-900 z-10 pointer-events-none"
          />
        )}
        {player.isCorrect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-green-900 z-10 pointer-events-none flex items-center justify-center"
          >
             <motion.div initial={{ scale: 0 }} animate={{ scale: 2 }} exit={{ scale: 0 }}>
                <Check size={100} className="text-white" strokeWidth={4} />
             </motion.div>
          </motion.div>
        )}
        {player.isFrozen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <Snowflake size={120} className="text-blue-200 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Box */}
      <motion.div 
        layout
        animate={player.isWrong ? { x: [-10, 10, -10, 10, 0] } : {}}
        className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-[32px] shadow-2xl p-6 md:p-10 mb-4 flex flex-col items-center justify-center border-b-[10px] border-black/10 relative"
      >
        <div className="absolute top-4 right-6 flex items-center gap-1">
          {player.streak >= STREAK_THRESHOLD && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              className="flex items-center gap-1 bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-bold"
            >
              <Flame size={14} className="fill-orange-600" />
              <span>{player.streak}</span>
            </motion.div>
          )}
        </div>
        <span className="text-gray-400 text-sm font-bold uppercase tracking-[0.2em] mb-4">
          {isAI ? 'الروبوت الذكي 🤖' : `الفريق ${playerNum}`}
        </span>
        <div className="text-7xl md:text-9xl font-black text-gray-900 tabular-nums tracking-tighter">
          {player.currentQuestion.num1} <span className="text-gray-300">{player.currentQuestion.symbol}</span> {player.currentQuestion.num2}
        </div>
      </motion.div>

      {/* Input Display */}
      <div className="w-full max-w-[240px] bg-black/20 rounded-2xl shadow-inner p-4 mb-6 flex items-center justify-center border-2 border-white/10 min-h-[80px] relative">
        <AnimatePresence mode="wait">
          <motion.span 
            key={player.input}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-6xl font-black text-white drop-shadow-lg"
          >
            {player.input || '؟'}
          </motion.span>
        </AnimatePresence>
        
        {isAI && player.isThinking && !player.input && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -bottom-8 text-xs font-bold text-white/60 animate-pulse"
          >
            الكمبيوتر يفكر...
          </motion.div>
        )}
      </div>

      {/* Power-up Button */}
      <div className="h-16 mb-4">
        {player.score >= 40 && !player.hasUsedFreeze && !player.isFrozen && (
          <motion.button
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => useFreeze(playerNum)}
            className="bg-blue-400 text-white px-6 py-3 rounded-2xl font-black shadow-lg flex items-center gap-2 border-b-4 border-blue-600"
          >
            <Snowflake size={20} />
            تجميد!
          </motion.button>
        )}
      </div>

      {/* Keypad */}
      <div className={`grid grid-cols-3 gap-4 w-full max-w-xs transition-opacity ${player.isFrozen || isAI ? 'opacity-20 pointer-events-none' : ''}`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(playerNum, num.toString())}
            className="aspect-square bg-white/10 hover:bg-white/20 active:scale-90 transition-all rounded-[20px] shadow-[0_6px_0_rgba(0,0,0,0.2)] flex items-center justify-center text-3xl md:text-4xl font-black text-white border border-white/20 backdrop-blur-md"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handleKeyPress(playerNum, 'C')}
          className="aspect-square bg-orange-500 hover:bg-orange-400 active:scale-90 transition-all rounded-[20px] shadow-[0_6px_0_rgb(154,52,18)] flex items-center justify-center text-3xl md:text-4xl font-black text-white border border-orange-600"
        >
          C
        </button>
        <button
          onClick={() => handleKeyPress(playerNum, '0')}
          className="aspect-square bg-white/10 hover:bg-white/20 active:scale-90 transition-all rounded-[20px] shadow-[0_6px_0_rgba(0,0,0,0.2)] flex items-center justify-center text-3xl md:text-4xl font-black text-white border border-white/20 backdrop-blur-md"
        >
          0
        </button>
        <button
          onClick={() => handleKeyPress(playerNum, '=')}
          className="aspect-square bg-emerald-500 hover:bg-emerald-400 active:scale-90 transition-all rounded-[20px] shadow-[0_6px_0_rgb(6,78,59)] flex items-center justify-center text-3xl md:text-4xl font-black text-white border border-emerald-600"
        >
          <Check size={48} strokeWidth={4} />
        </button>
      </div>
    </div>
  );
  };

  return (
    <div className="flex flex-col h-screen w-full font-sans bg-slate-950 text-white selection:bg-blue-500/30" dir="rtl">
      {/* Mode Selection Overlay */}
      <AnimatePresence>
        {!gameMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950 p-4"
          >
            <div className="max-w-md w-full space-y-8">
              <div className="text-center space-y-4">
                <h1 className="text-6xl font-black tracking-tighter italic">Numbers Marathon</h1>
                <p className="text-slate-400 font-bold">اختر وضع اللعب للبدء</p>
              </div>

              <div className="grid gap-4">
                <button 
                  onClick={() => setGameMode('PvP')}
                  className="p-8 bg-blue-600 hover:bg-blue-500 rounded-[32px] shadow-2xl shadow-blue-900/40 transition-all active:scale-95 flex flex-col items-center gap-4 border-b-8 border-blue-800"
                >
                  <User size={48} />
                  <span className="text-2xl font-black">لاعب ضد لاعب</span>
                </button>

                <div className="space-y-4">
                  <button 
                    onClick={() => setGameMode('PvAI')}
                    className="w-full p-8 bg-slate-800 hover:bg-slate-700 rounded-[32px] shadow-2xl transition-all active:scale-95 flex flex-col items-center gap-4 border-b-8 border-slate-900"
                  >
                    <div className="text-5xl">🤖</div>
                    <span className="text-2xl font-black">لاعب ضد الكمبيوتر</span>
                  </button>
                  
                  {gameMode === 'PvAI' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="grid grid-cols-3 gap-2 p-2 bg-white/5 rounded-2xl border border-white/10"
                    >
                      {(['Easy', 'Medium', 'Impossible'] as AIMode[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setAiMode(m)}
                          className={`py-3 rounded-xl text-xs font-bold transition-all ${aiMode === m ? 'bg-white text-slate-950' : 'hover:bg-white/10'}`}
                        >
                          {m === 'Easy' ? 'سهل' : m === 'Medium' ? 'متوسط' : 'مستحيل'}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {gameMode && !selectedOperation && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950 p-4"
          >
            <div className="max-w-2xl w-full space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-black tracking-tighter italic">اختر العملية</h2>
                <p className="text-slate-400 font-bold">حدد نوع المسائل التي تريد حلها</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'addition', label: 'الجمع', symbol: '+', color: 'bg-emerald-600' },
                  { id: 'subtraction', label: 'الطرح', symbol: '-', color: 'bg-orange-600' },
                  { id: 'multiplication', label: 'الضرب', symbol: '×', color: 'bg-blue-600' },
                  { id: 'division', label: 'القسمة', symbol: '÷', color: 'bg-purple-600' },
                ].map((op) => (
                  <button 
                    key={op.id}
                    onClick={() => {
                      setSelectedOperation(op.id as MathOperation);
                      setPlayer1(createInitialPlayerState(difficulty, op.id as MathOperation));
                      setPlayer2(createInitialPlayerState(difficulty, op.id as MathOperation));
                    }}
                    className={`p-6 ${op.color} hover:brightness-110 rounded-[32px] shadow-xl transition-all active:scale-95 flex flex-col items-center gap-2 border-b-8 border-black/20`}
                  >
                    <span className="text-5xl font-black">{op.symbol}</span>
                    <span className="font-black">{op.label}</span>
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => {
                  setSelectedOperation('mixed');
                  setPlayer1(createInitialPlayerState(difficulty, 'mixed'));
                  setPlayer2(createInitialPlayerState(difficulty, 'mixed'));
                }}
                className="w-full p-6 bg-gradient-to-r from-indigo-600 to-pink-600 hover:brightness-110 rounded-[32px] shadow-xl transition-all active:scale-95 flex flex-col items-center gap-2 border-b-8 border-black/20"
              >
                <span className="text-3xl font-black">🔀</span>
                <span className="text-xl font-black">التحدي المختلط (Mixed)</span>
              </button>

              <button 
                onClick={() => setGameMode(null)}
                className="w-full py-4 text-slate-400 font-bold hover:text-white transition-colors"
              >
                ← العودة لاختيار الوضع
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Hamburger */}
      <header className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
           {/* Empty for balance or logo */}
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="pointer-events-auto w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl hover:bg-white/20 transition-all active:scale-90"
        >
          <Menu size={32} />
        </button>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-slate-900 z-[70] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] p-8 flex flex-col border-l border-white/10"
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-2xl font-black tracking-tight">القائمة</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={28} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">مستوى الصعوبة</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['سهل', 'متوسط', 'صعب'] as Difficulty[]).map((d) => (
                      <button
                        key={d}
                        onClick={() => changeDifficulty(d)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all border ${difficulty === d ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-900/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={resetGame}
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group"
                >
                  <div className="w-10 h-10 bg-orange-500/20 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <RotateCcw size={20} />
                  </div>
                  <span className="font-bold">العودة للقائمة الرئيسية</span>
                </button>

                <button 
                  onClick={() => { setShowHowToPlay(true); setIsSidebarOpen(false); }}
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group"
                >
                  <div className="w-10 h-10 bg-blue-500/20 text-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Info size={20} />
                  </div>
                  <span className="font-bold">طريقة اللعب</span>
                </button>

                <button 
                  onClick={() => { setShowAbout(true); setIsSidebarOpen(false); }}
                  className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group"
                >
                  <div className="w-10 h-10 bg-purple-500/20 text-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User size={20} />
                  </div>
                  <span className="font-bold">عن المطور</span>
                </button>
              </div>

              <div className="mt-auto pt-8 border-t border-white/10 text-center">
                <p className="text-slate-500 text-sm font-medium">Numbers Marathon v2.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Game Area */}
      <div className="flex flex-1 relative">
        {/* Player 1 - Royal Blue */}
        <PlayerPanel player={player1} playerNum={1} color="bg-[#2563eb]" accentColor="#1d4ed8" />

        {/* Player 2 - Coral Red */}
        <PlayerPanel player={player2} playerNum={2} color="bg-[#ef4444]" accentColor="#dc2626" />

        {/* Central Scoreboard - Glassmorphism */}
        <div className="absolute top-4 md:top-12 left-1/2 -translate-x-1/2 z-20 w-64 md:w-72 bg-white/10 backdrop-blur-2xl rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col items-center p-4 md:p-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-2 md:mb-4">
            <div className="bg-white/10 text-white/80 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] border border-white/10">
              الهدف: {TARGET_SCORE}
            </div>
            {selectedOperation && (
              <div className="bg-white/20 text-white px-2 py-1 rounded-lg text-xs font-black">
                {selectedOperation === 'addition' ? '+' : 
                 selectedOperation === 'subtraction' ? '-' : 
                 selectedOperation === 'multiplication' ? '×' : 
                 selectedOperation === 'division' ? '÷' : '🔀'}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between w-full px-2">
            <div className="flex flex-col items-center">
              <motion.span 
                key={player1.score}
                initial={{ scale: 1.5, color: '#60a5fa' }}
                animate={{ scale: 1, color: '#ffffff' }}
                className="font-black text-4xl md:text-6xl tracking-tighter"
              >
                {player1.score}
              </motion.span>
              <span className="text-[10px] font-black text-white/40 uppercase mt-1">فريق 1</span>
            </div>
            <div className="h-12 w-[1px] bg-white/10 mx-4" />
            <div className="flex flex-col items-center">
              <motion.span 
                key={player2.score}
                initial={{ scale: 1.5, color: '#f87171' }}
                animate={{ scale: 1, color: '#ffffff' }}
                className="font-black text-4xl md:text-6xl tracking-tighter"
              >
                {player2.score}
              </motion.span>
              <span className="text-[10px] font-black text-white/40 uppercase mt-1">فريق 2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals (How to Play, About, Winner) */}
      <AnimatePresence>
        {showHowToPlay && (
          <Modal title="طريقة اللعب" onClose={() => setShowHowToPlay(false)}>
            <div className="space-y-4 text-slate-300 text-right">
              <p>• تسابق مع صديقك لحل مسائل الضرب بأسرع ما يمكن.</p>
              <p>• كل إجابة صحيحة تمنحك 10 نقاط.</p>
              <p>• <span className="text-orange-400 font-bold">نظام Streak:</span> 3 إجابات صحيحة متتالية تمنحك 15 نقطة لكل إجابة تالية!</p>
              <p>• <span className="text-blue-400 font-bold">تجميد:</span> عند الوصول لـ 40 نقطة، يمكنك تجميد الخصم لـ 3 ثوانٍ.</p>
              <p>• أول من يصل إلى 100 نقطة يفوز بالماراثون!</p>
            </div>
          </Modal>
        )}

        {showAbout && (
          <Modal title="عن المطور" onClose={() => setShowAbout(false)}>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl">
                <User size={40} className="text-white" />
              </div>
              <p className="text-slate-300">تم تطوير هذا التطبيق بواسطة مطور تطبيقات ويب خبير لتقديم تجربة تعليمية ممتعة واحترافية.</p>
              <div className="flex justify-center gap-4 pt-4">
                <Twitter className="text-slate-400 hover:text-blue-400 cursor-pointer" />
                <Facebook className="text-slate-400 hover:text-blue-600 cursor-pointer" />
                <Instagram className="text-slate-400 hover:text-pink-500 cursor-pointer" />
              </div>
            </div>
          </Modal>
        )}

        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 rounded-[48px] p-12 max-w-md w-full text-center shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] border border-white/10 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
              
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-28 h-28 ${winner === 1 ? 'bg-blue-600 shadow-blue-500/50' : 'bg-red-600 shadow-red-500/50'} text-white rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl`}
              >
                <Trophy size={56} strokeWidth={2.5} />
              </motion.div>
              
              <h2 className="text-5xl font-black text-white mb-4 tracking-tighter italic">الملك وصل لـ 100!</h2>
              <p className="text-2xl font-bold text-slate-400 mb-10">
                مبروك للفريق <span className={winner === 1 ? 'text-blue-500' : 'text-red-500'}>{winner}</span>
              </p>
              
              <button
                onClick={resetGame}
                className="w-full py-6 bg-white text-slate-950 text-xl font-black rounded-3xl shadow-xl hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-4"
              >
                <RotateCcw size={24} />
                إعادة التحدي
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string, children: ReactNode, onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>
        {children}
        <button
          onClick={onClose}
          className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all border border-white/10"
        >
          إغلاق
        </button>
      </motion.div>
    </motion.div>
  );
}
