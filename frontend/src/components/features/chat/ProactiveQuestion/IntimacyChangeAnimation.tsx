'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

interface IntimacyChangeAnimationProps {
  show: boolean;
  value: number;
  x: number;
  y: number;
}

export const IntimacyChangeAnimation: React.FC<IntimacyChangeAnimationProps> = ({
  show,
  value,
  x,
  y
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: [0, -20, -40, -60],
            scale: [0.5, 1.2, 1, 0.8]
          }}
          transition={{ 
            duration: 2,
            times: [0, 0.2, 0.7, 1],
            ease: "easeOut"
          }}
          className="fixed z-50 pointer-events-none"
          style={{ left: x, top: y }}
        >
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${
              value > 0 ? 'text-pink-500' : 'text-gray-500'
            }`}>
              {value > 0 ? '+' : ''}{value}
            </span>
            <motion.div
              animate={{ 
                rotate: [0, -15, 15, -15, 0],
                scale: [1, 1.1, 1.2, 1.1, 1]
              }}
              transition={{ 
                duration: 0.5,
                repeat: 2,
                repeatType: "reverse"
              }}
            >
              <Heart 
                className={`w-6 h-6 ${value > 0 ? 'text-pink-500' : 'text-gray-500'}`}
                fill={value > 0 ? 'currentColor' : 'none'}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};