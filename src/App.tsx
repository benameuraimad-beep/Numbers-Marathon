/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Info, Twitter, Facebook, Instagram, Check, RotateCcw } from 'lucide-react';

// --- Types ---
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
}

const TARGET_SCORE = 100;
const POINTS_PER_CORRECT = 10;

export default function App() {
  // --- Game State ---
  const [player1, setPlayer1] = useState<PlayerState>(() => createInitialPlayerState());
  const [player2, setPlayer2] = useState<PlayerState>(() => createInitialPlayerState());
  const [winner, setWinner] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);

  // --- Helpers ---
  function generateQuestion(): Question {
    const num1 = Math.floor(Math.random() * 12) + 1;
    const num2 = Math.floor(Math.random() * 12) + 1;
    return { num1, num2, answer: num1 * num2 };
  }

  function createInitialPlayerState(): PlayerState {
    return {
      score: 0,
      currentQuestion: generateQuestion(),
      input: '',
      isWrong: false,
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
          }
          return {
            ...prev,
            score: newScore,
            currentQuestion: generateQuestion(),
            input: '',
            isWrong: false,
          };
        } else {
          return { ...prev, input: '', isWrong: true };
        }
      }
      // Limit input length
      if (prev.input.length >= 3) return prev;
      return { ...prev, input: prev.input + key, isWrong: false };
    });
  };

  // Reset wrong state after animation
  useEffect(() => {
    if (player1.isWrong) {
      const timer = setTimeout(() => setPlayer1(p => ({ ...p, isWrong: false })), 500);
      return () => clearTimeout(timer);
    }
  }, [player1.isWrong]);

  useEffect(() => {
    if (player2.isWrong) {
      const timer = setTimeout(() => setPlayer2(p => ({ ...p, isWrong: false })), 500);
      return () => clearTimeout(timer);
    }
  }, [player2.isWrong]);

  const resetGame = () => {
    setPlayer1(createInitialPlayerState());
    setPlayer2(createInitialPlayerState());
    setWinner(null);
  };

  // --- Components ---
  const PlayerPanel = ({ player, playerNum, colorClass }: { player: PlayerState, playerNum: 1 | 2, colorClass: string }) => (
    <div className={`relative flex flex-col items-center justify-start h-full w-full p-6 pt-20 ${colorClass} transition-colors duration-300`}>
      {/* Wrong Answer Flash */}
      <AnimatePresence>
        {player.isWrong && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-600 z-10 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Question Box */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 mb-6 flex flex-col items-center justify-center border-b-8 border-gray-200">
        <span className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">اللاعب {playerNum}</span>
        <div className="text-7xl md:text-8xl font-black text-gray-800 tabular-nums">
          {player.currentQuestion.num1} × {player.currentQuestion.num2}
        </div>
      </div>

      {/* Input Display */}
      <div className="w-full max-w-[200px] bg-white rounded-2xl shadow-inner p-4 mb-8 flex items-center justify-center border-4 border-gray-100 min-h-[80px]">
        <span className="text-5xl font-bold text-gray-700">{player.input || '?'}</span>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(playerNum, num.toString())}
            className="aspect-square bg-yellow-400 hover:bg-yellow-300 active:scale-95 transition-all rounded-2xl shadow-[0_6px_0_rgb(202,138,4)] flex items-center justify-center text-3xl font-bold text-yellow-900 border-2 border-yellow-500"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handleKeyPress(playerNum, 'C')}
          className="aspect-square bg-red-500 hover:bg-red-400 active:scale-95 transition-all rounded-2xl shadow-[0_6px_0_rgb(153,27,27)] flex items-center justify-center text-3xl font-bold text-white border-2 border-red-600"
        >
          C
        </button>
        <button
          onClick={() => handleKeyPress(playerNum, '0')}
          className="aspect-square bg-yellow-400 hover:bg-yellow-300 active:scale-95 transition-all rounded-2xl shadow-[0_6px_0_rgb(202,138,4)] flex items-center justify-center text-3xl font-bold text-yellow-900 border-2 border-yellow-500"
        >
          0
        </button>
        <button
          onClick={() => handleKeyPress(playerNum, '=')}
          className="aspect-square bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all rounded-2xl shadow-[0_6px_0_rgb(6,95,70)] flex items-center justify-center text-3xl font-bold text-white border-2 border-emerald-600"
        >
          <Check size={40} strokeWidth={3} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans bg-gray-100" dir="rtl">
      {/* Main Game Area */}
      <div className="flex flex-1 relative">
        {/* Player 1 - Blue */}
        <PlayerPanel player={player1} playerNum={1} colorClass="bg-blue-500" />

        {/* Player 2 - Red */}
        <PlayerPanel player={player2} playerNum={2} colorClass="bg-red-500" />

        {/* Central Scoreboard */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 w-64 bg-white rounded-3xl shadow-2xl border-4 border-white flex flex-col items-center p-4 overflow-hidden">
          <div className="bg-gray-800 text-white px-4 py-1 rounded-full text-xs font-bold mb-3">
            الهدف: {TARGET_SCORE}
          </div>
          <div className="flex items-center justify-between w-full px-4">
            <div className="flex flex-col items-center">
              <span className="text-blue-600 font-black text-4xl">{player1.score}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">اللاعب 1</span>
            </div>
            <div className="h-10 w-[2px] bg-gray-100 mx-2" />
            <div className="flex flex-col items-center">
              <span className="text-red-600 font-black text-4xl">{player2.score}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">اللاعب 2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-20 bg-slate-900 flex items-center justify-between px-8 text-white z-30">
        <div className="flex gap-4">
          <button className="flex items-center gap-2 hover:text-blue-400 transition-colors font-bold">
            <Home size={20} />
            الرئيسية
          </button>
          <button 
            onClick={() => setShowRules(true)}
            className="flex items-center gap-2 hover:text-blue-400 transition-colors font-bold"
          >
            <Info size={20} />
            قواعد اللعبة
          </button>
        </div>

        <div className="flex gap-6">
          <Twitter className="cursor-pointer hover:text-blue-400 transition-colors" size={20} />
          <Facebook className="cursor-pointer hover:text-blue-600 transition-colors" size={20} />
          <Instagram className="cursor-pointer hover:text-pink-500 transition-colors" size={20} />
        </div>
      </footer>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRules(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-b-8 border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info size={32} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-4">قواعد اللعبة</h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                كل إجابة صحيحة = 10 نقاط.
                <br />
                الفائز من يصل إلى 100 نقطة أولاً.
              </p>
              <button
                onClick={() => setShowRules(false)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-[0_6px_0_rgb(30,58,138)] active:translate-y-1 active:shadow-none transition-all"
              >
                فهمت!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Modal */}
      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white rounded-[40px] p-10 max-w-md w-full text-center shadow-2xl border-b-[12px] border-gray-200 relative overflow-hidden"
            >
              {/* Confetti-like background elements could go here */}
              <div className={`w-24 h-24 ${winner === 1 ? 'bg-blue-500' : 'bg-red-500'} text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                <Check size={48} strokeWidth={4} />
              </div>
              <h2 className="text-4xl font-black text-gray-800 mb-2">مبروك!</h2>
              <p className="text-2xl font-bold mb-8">
                اللاعب <span className={winner === 1 ? 'text-blue-600' : 'text-red-600'}>{winner}</span> هو الفائز!
              </p>
              <button
                onClick={resetGame}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white text-xl font-black rounded-3xl shadow-[0_8px_0_rgb(6,95,70)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
              >
                <RotateCcw size={24} />
                إعادة اللعب
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
