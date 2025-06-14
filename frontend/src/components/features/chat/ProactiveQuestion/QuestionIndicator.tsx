'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles } from 'lucide-react';

interface QuestionIndicatorProps {
  show: boolean;
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
  partnerName: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export const QuestionIndicator: React.FC<QuestionIndicatorProps> = ({
  show,
  priority,
  reasoning,
  partnerName,
  onAccept,
  onDismiss
}) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return 'from-red-50 to-pink-50 border-red-200';
      case 'medium':
        return 'from-purple-50 to-indigo-50 border-purple-200';
      case 'low':
        return 'from-blue-50 to-cyan-50 border-blue-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getPriorityLabel = () => {
    switch (priority) {
      case 'high':
        return '話したがっています';
      case 'medium':
        return '何か聞きたいことがあるようです';
      case 'low':
        return 'ちょっと話したそうです';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`bg-gradient-to-r ${getPriorityColor()} p-4 rounded-lg mb-4 border shadow-sm`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </motion.div>
                <h4 className="text-sm font-semibold text-gray-800">
                  {partnerName}が{getPriorityLabel()}
                </h4>
              </div>
              <p className="text-xs text-gray-600 mb-3">{reasoning}</p>
            </div>
            
            <div className="flex gap-2 ml-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAccept}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm rounded-full hover:from-purple-700 hover:to-pink-700 transition-all shadow-md flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                話を聞く
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDismiss}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-full hover:bg-gray-300 transition-all"
              >
                後で
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};