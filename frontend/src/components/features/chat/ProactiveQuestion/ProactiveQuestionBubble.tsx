'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquareQuote, Sparkles } from 'lucide-react';

interface ProactiveQuestionBubbleProps {
  question: string;
  emotionalTone?: string;
  questionType?: string;
  partnerName: string;
  avatarUrl?: string;
}

export const ProactiveQuestionBubble: React.FC<ProactiveQuestionBubbleProps> = ({
  question,
  emotionalTone,
  questionType,
  partnerName,
  avatarUrl
}) => {
  const getQuestionTypeLabel = () => {
    switch (questionType) {
      case 'greeting':
        return '挨拶';
      case 'follow_up':
        return '続きの質問';
      case 'deepening':
        return '深い質問';
      case 'daily_check':
        return '日常の確認';
      default:
        return '質問';
    }
  };

  const getEmotionalToneColor = () => {
    switch (emotionalTone) {
      case 'cheerful':
        return 'from-yellow-100 to-orange-100 border-yellow-300';
      case 'curious':
        return 'from-blue-100 to-cyan-100 border-blue-300';
      case 'caring':
        return 'from-pink-100 to-rose-100 border-pink-300';
      case 'thoughtful':
        return 'from-purple-100 to-indigo-100 border-purple-300';
      default:
        return 'from-gray-100 to-gray-200 border-gray-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3 mb-4"
    >
      {/* アバター */}
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={partnerName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
            {partnerName.charAt(0)}
          </div>
        )}
      </div>

      {/* メッセージバブル */}
      <div className="flex-1 max-w-md">
        <div className={`bg-gradient-to-r ${getEmotionalToneColor()} rounded-2xl rounded-tl-none p-4 border`}>
          {/* 質問タイプラベル */}
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-700">
              {getQuestionTypeLabel()}
            </span>
          </div>

          {/* 質問内容 */}
          <p className="text-gray-800 whitespace-pre-wrap">{question}</p>

          {/* AI質問インジケーター */}
          <div className="flex items-center gap-1 mt-3 text-xs text-gray-600">
            <MessageSquareQuote className="w-3 h-3" />
            <span>AIからの質問</span>
          </div>
        </div>

        {/* タイピングアニメーション */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-1 ml-2"
        >
          <span className="text-xs text-gray-500">{partnerName}</span>
        </motion.div>
      </div>
    </motion.div>
  );
};