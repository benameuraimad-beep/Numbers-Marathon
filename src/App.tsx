/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Check, RotateCcw, Info, User, Settings, Trophy, Twitter, Facebook, Instagram } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types ---
type Difficulty = 'سهل' | 'متوسط' | 'صعب';

interface Question {
  num1: number;
  num2: number;
  answer: number;
}

interface PlayerState {
  score: number;
  currentQuestion: Question;
  input: string;
  isWrong: boolean;
  isCorrect: boolean;
}

const TARGET_SCORE = 100;
const POINTS_PER_CORRECT = 10;

export default function App() {
  // --- Game State ---
  const [difficulty, setDifficulty] = useState<Difficulty>('متوسط');
  const [player1, setPlayer1] = useState<PlayerState>(() => createInitialPlayerState('متوسط'));
  const [player2, setPlayer2] = useState<PlayerState>(() => createInitialPlayerState('متوسط'));
  const [winner, setWinner] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // --- Helpers ---
  function generateQuestion(diff: Difficulty): Question {
    let max = 12;
    if (diff === 'سهل') max = 5;
    if (diff === 'صعب') max = 20;
    
    const num1 = Math.floor(Math.random() * max) + 1;
    const num2 = Math.floor(Math.random() * max) + 1;
    return { num1, num2, answer: num1 * num2 };
  }

  function createInitialPlayerState(diff: Difficulty): PlayerState {
    return {
      score: 0,
      currentQuestion: generateQuestion(diff),
      input: '',
      isWrong: false,
      isCorrect: false,
    };
  }

  const handleKeyPress = (playerNum: 1 | 2, key: string) => {
    if (winner) return;

    const setPlayer = playerNum === 1 ? setPlayer1 : setPlayer2;

    setPlayer((prev) => {
      if (key === 'C') {
        return { ...prev, input: '' };
      }
      if (key === '=') {
        const isCorrect = parseInt(prev.input) === prev.currentQuestion.answer;
        if (isCorrect) {
          const newScore = prev.score + POINTS_PER_CORRECT;
          if (newScore >= TARGET_SCORE) {
            setWinner(playerNum);
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: playerNum === 1 ? ['#2563eb', '#ffffff'] : ['#ef4444', '#ffffff']
            });
          }
          return {
            ...prev,
            score: newScore,
            currentQuestion: generateQuestion(difficulty),
            input: '',
            isWrong: false,
            isCorrect: true,
          };
        } else {
          return { ...prev, input: '', isWrong: true, isCorrect: false };
        }
      }
      if (prev.input.length >= 4) return prev;
      return { ...prev, input: prev.input + key, isWrong: false, isCorrect: false };
    });
  };

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
    setPlayer1(createInitialPlayerState(difficulty));
    setPlayer2(createInitialPlayerState(difficulty));
    setWinner(null);
    setIsSidebarOpen(false);
  };

  const changeDifficulty = (newDiff: Difficulty) => {
    setDifficulty(newDiff);
    setPlayer1(createInitialPlayerState(newDiff));
    setPlayer2(createInitialPlayerState(newDiff));
    setWinner(null);
    setIsSidebarOpen(false);
  };

  // --- Components ---
  const PlayerPanel = ({ player, playerNum, color, accentColor }: { player: PlayerState, playerNum: 1 | 2, color: string, accentColor: string }) => (
    <div className={`relative flex flex-col items-center justify-start h-full w-full p-4 md:p-8 pt-12 ${color} transition-all duration-500 overflow-y-auto custom-scrollbar`}>
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
      </AnimatePresence>

      {/* Question Box */}
      <motion.div 
        layout
        className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-[32px] shadow-2xl p-6 md:p-10 mb-4 flex flex-col items-center justify-center border-b-[10px] border-black/10"
      >
        <span className="text-gray-400 text-sm font-bold uppercase tracking-[0.2em] mb-4">الفريق {playerNum}</span>
        <div className="text-7xl md:text-9xl font-black text-gray-900 tabular-nums tracking-tighter">
          {player.currentQuestion.num1} <span className="text-gray-300">×</span> {player.currentQuestion.num2}
        </div>
      </motion.div>

      {/* Input Display */}
      <div className="w-full max-w-[240px] bg-black/20 rounded-2xl shadow-inner p-4 mb-6 flex items-center justify-center border-2 border-white/10 min-h-[80px]">
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
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
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

  return (
    <div className="flex flex-col h-screen w-full font-sans bg-slate-950 text-white selection:bg-blue-500/30" dir="rtl">
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
                  <span className="font-bold">إعادة ضبط النقاط</span>
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
          <div className="bg-white/10 text-white/80 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-2 md:mb-4 border border-white/10">
            الهدف: {TARGET_SCORE}
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
              <p>• أول من يصل إلى 100 نقطة يفوز بالماراثون!</p>
              <p>• استخدم زر (C) للمسح وزر (✔) للتأكيد.</p>
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
              
              <h2 className="text-5xl font-black text-white mb-4 tracking-tighter italic">Winner!</h2>
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
