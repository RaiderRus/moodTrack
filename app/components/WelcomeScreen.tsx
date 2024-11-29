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
              className="absolute -inset-16 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
              initial={{ opacity: 0.5, filter: "blur(20px)" }}
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              whileHover={{
                scale: [1.2, 1.4, 1.2],
                opacity: [0.6, 0.8, 0.6],
                filter: "blur(25px)",
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.button
              className="relative w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer"
              onClick={handleClick}
              whileHover={{ 
                boxShadow: "0 0 40px rgba(0,0,0,0.1)",
                scale: 1.05,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
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