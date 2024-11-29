"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

interface WelcomeScreenProps {
  onComplete: () => void;
  onStartAnimation: () => void;
}

export default function WelcomeScreen({ onComplete, onStartAnimation }: WelcomeScreenProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onStartAnimation();
    // Задержка перед вызовом onComplete, чтобы анимация успела проиграться
    setTimeout(onComplete, 1000);
  };

  return (
    <AnimatePresence>
      {!isAnimating ? (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              className="absolute -inset-4 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ filter: "blur(15px)", opacity: 0.5 }}
            />
            <motion.button
              className="relative w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer"
              onClick={handleClick}
              whileHover={{ boxShadow: "0 0 30px rgba(0,0,0,0.1)" }}
            >
              <Plus className="w-12 h-12 text-slate-600" />
            </motion.button>
          </motion.div>
          <motion.p
            className="mt-6 text-lg text-slate-600 font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            track my mood
          </motion.p>
        </motion.div>
      ) : (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-white z-50"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Анимация "рассыпания" */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: Math.cos(i * 30 * (Math.PI / 180)) * 100,
                y: Math.sin(i * 30 * (Math.PI / 180)) * 100,
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}