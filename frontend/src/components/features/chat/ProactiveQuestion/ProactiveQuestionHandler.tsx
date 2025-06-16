'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Partner, Message, MessageSender } from '@/types';
import { chatApiService } from '@/services/api/chat.api';
import { memoryApiService } from '@/services/api/memory.api';
import { QuestionIndicator } from './QuestionIndicator';
import { IntimacyChangeAnimation } from './IntimacyChangeAnimation';

interface ProactiveQuestionHandlerProps {
  partner: Partner | null;
  messages: Message[];
  isTyping: boolean;
  onNewMessage: (message: Message) => void;
  onPartnerUpdate: (partner: Partner) => void;
  onTypingStateChange: (isTyping: boolean) => void;
}

interface QuestionSuggestion {
  show: boolean;
  priority?: 'low' | 'medium' | 'high';
  reasoning?: string;
  type?: string;
}

const ProactiveQuestionHandler = React.forwardRef<
  { extractMemoryFromResponse: (question: string, userResponse: string, questionType?: string) => Promise<void> },
  ProactiveQuestionHandlerProps
>(({
  partner,
  messages,
  isTyping,
  onNewMessage,
  onPartnerUpdate,
  onTypingStateChange
}, ref) => {
  const [questionSuggestion, setQuestionSuggestion] = useState<QuestionSuggestion>({ show: false });
  const [nextQuestionSuggestions, setNextQuestionSuggestions] = useState<string[]>([]);
  const [intimacyAnimation, setIntimacyAnimation] = useState<{
    show: boolean;
    value?: number;
    x?: number;
    y?: number;
  }>({ show: false });
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckTimeRef = useRef<Date>(new Date());

  // 質問タイミングチェック
  const checkIfShouldAskQuestion = useCallback(async () => {
    console.log('=== AI話しかけチェック開始 ===');
    console.log('partner:', partner?.name);
    console.log('isTyping:', isTyping);
    
    if (!partner || isTyping) return;

    try {
      // 最後のメッセージからの経過時間を計算
      const lastMessage = messages[messages.length - 1];
      console.log('最後のメッセージ:', lastMessage?.content, 'from:', lastMessage?.sender);
      
      // 最新2つのメッセージがどちらもAIからの場合は何もしない（3連続防止）
      const lastTwoMessages = messages.slice(-2);
      if (lastTwoMessages.length >= 2 && 
          lastTwoMessages.every(msg => msg.sender === MessageSender.PARTNER)) {
        console.log('AI2連続なので停止');
        return;
      }
      
      const silenceDuration = lastMessage 
        ? Math.floor((Date.now() - new Date(lastMessage.createdAt).getTime()) / (1000 * 60))
        : 0;
      console.log('沈黙時間:', silenceDuration, '分');

      const now = new Date();
      const response = await chatApiService.shouldAskQuestion({
        partnerId: partner.id,
        silenceDuration,
        currentIntimacy: partner.intimacyLevel,
        timeContext: {
          hour: now.getHours(),
          dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
          isWeekend: now.getDay() === 0 || now.getDay() === 6
        }
      });
      
      console.log('APIレスポンス:', response);
      console.log('shouldAsk:', response.data?.shouldAsk);
      console.log('理由:', response.data?.reasoning);

      if (response.success && response.data && response.data.shouldAsk) {
        console.log('AI発言を生成します');
        // 優先度に関わらず自動的に話しかける
        await generateAndSendProactiveQuestion(response.data.suggestedQuestionType);
      } else {
        console.log('AI発言スキップ');
      }
    } catch (error) {
      console.error('質問タイミングチェックエラー:', error);
    }
  }, [partner, messages, isTyping]);

  // AI主導質問の生成と送信
  const generateAndSendProactiveQuestion = useCallback(async (questionType?: string) => {
    if (!partner) return;

    onTypingStateChange(true);
    try {
      // 質問を生成  
      const recentMessages = messages.slice(-5);
      const lastMessage = recentMessages[recentMessages.length - 1];
      
      const response = await chatApiService.generateProactiveQuestion({
        partnerId: partner.id,
        currentIntimacy: partner.intimacyLevel,
        lastInteractionContext: {
          topic: questionType,
          depth: 'normal',
          emotionalTone: lastMessage?.emotion || 'neutral'
        },
        recentContext: {
          lastMessageContent: lastMessage?.content,
          lastMessageTime: lastMessage ? new Date(lastMessage.createdAt) : undefined,
          silenceDuration: lastMessage 
            ? Math.floor((Date.now() - new Date(lastMessage.createdAt).getTime()) / (1000 * 60))
            : 0
        }
      });

      if (response.success && response.data) {
        // バックエンドで既にDBに保存されたメッセージを使用
        const aiQuestion: Message = {
          id: response.data.messageId || `ai-question-${Date.now()}`,
          partnerId: partner.id,
          content: response.data.question,
          sender: MessageSender.PARTNER,
          emotion: response.data.emotionalTone as any,
          metadata: {
            isProactiveQuestion: true,
            questionType: response.data.questionType,
            expectedDepth: response.data.expectedDepth
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // フロントエンドの状態を更新（バックエンドで既に保存済み）
        onNewMessage(aiQuestion);

        // 次の質問候補を保存
        if (response.data.followUpSuggestions) {
          setNextQuestionSuggestions(response.data.followUpSuggestions);
        }
      }
    } catch (error) {
      console.error('AI質問生成エラー:', error);
    } finally {
      onTypingStateChange(false);
    }
  }, [partner, messages, onNewMessage, onTypingStateChange]);

  // メモリ抽出（外部から呼び出される）
  const extractMemoryFromResponse = useCallback(async (
    question: string, 
    userResponse: string,
    questionType?: string
  ) => {
    if (!partner) return;

    try {
      const response = await memoryApiService.extractFromResponse({
        partnerId: partner.id,
        question,
        userResponse,
        intimacyLevel: partner.intimacyLevel,
        questionType: questionType as any // 型変換
      });

      if (response.success && response.data) {
        // 親密度の更新を反映
        if (response.data.intimacyChange && response.data.intimacyChange !== 0) {
          const newIntimacy = Math.max(0, Math.min(100, 
            partner.intimacyLevel + response.data.intimacyChange
          ));
          
          onPartnerUpdate({ ...partner, intimacyLevel: newIntimacy });
          
          // 親密度変化のアニメーション表示
          showIntimacyChange(response.data.intimacyChange);
        }

        // フォローアップ質問の提案があれば保存
        if (response.data && response.data.followUpSuggestions && response.data.followUpSuggestions.length > 0) {
          setNextQuestionSuggestions(prev => [...response.data!.followUpSuggestions, ...prev]);
        }
      }
    } catch (error) {
      console.error('メモリ抽出エラー:', error);
    }
  }, [partner, onPartnerUpdate]);

  // 親密度変化アニメーション
  const showIntimacyChange = (change: number) => {
    setIntimacyAnimation({
      show: true,
      value: change,
      x: Math.random() * window.innerWidth,
      y: window.innerHeight / 2
    });

    setTimeout(() => {
      setIntimacyAnimation({ show: false });
    }, 2000);
  };

  // 定期的なチェック
  useEffect(() => {
    console.log('=== ProactiveQuestionHandler 初期化 ===');
    console.log('partner存在:', !!partner);
    
    if (!partner) return;

    // 初回チェック
    console.log('初回チェック実行');
    checkIfShouldAskQuestion();

    // 1分ごとにチェック
    checkIntervalRef.current = setInterval(() => {
      console.log('定期チェック実行');
      checkIfShouldAskQuestion();
    }, 1 * 60 * 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [partner, checkIfShouldAskQuestion]);

  // 質問提案の受け入れ
  const handleAcceptQuestion = () => {
    generateAndSendProactiveQuestion(questionSuggestion.type);
    setQuestionSuggestion({ show: false });
  };

  // 質問提案の拒否
  const handleDismissQuestion = () => {
    setQuestionSuggestion({ show: false });
  };

  // 外部から呼び出し可能なメソッドをexpose
  React.useImperativeHandle(ref, () => ({
    extractMemoryFromResponse
  }));

  return (
    <>
      <QuestionIndicator
        show={questionSuggestion.show}
        priority={questionSuggestion.priority || 'low'}
        reasoning={questionSuggestion.reasoning || ''}
        partnerName={partner?.name || ''}
        onAccept={handleAcceptQuestion}
        onDismiss={handleDismissQuestion}
      />

      <IntimacyChangeAnimation
        show={intimacyAnimation.show}
        value={intimacyAnimation.value || 0}
        x={intimacyAnimation.x || 0}
        y={intimacyAnimation.y || 0}
      />
    </>
  );
});

ProactiveQuestionHandler.displayName = 'ProactiveQuestionHandler';

export { ProactiveQuestionHandler };