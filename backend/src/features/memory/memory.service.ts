import OpenAI from 'openai';
import MemoryModel from '@/db/models/Memory.model';
import RelationshipMetricsModel from '@/db/models/RelationshipMetrics.model';
import EpisodeMemoryModel from '@/db/models/EpisodeMemory.model';
import MessageModel from '@/db/models/Message.model';
import PartnerModel from '@/db/models/Partner.model';
import { 
  Memory, 
  MemoryType, 
  RelationshipMetrics, 
  EpisodeMemory,
  Message as IMessage,
  MessageSender,
  ID,
  MemorySummaryRequest 
} from '@/types';

interface MemorySearchRequest {
  partnerId: ID;
  query: string;
  memoryTypes?: MemoryType[];
  limit?: number;
  minImportance?: number;
}

// MemorySummaryRequest は @/types からインポートして使用

interface OngoingTopic {
  id: string;
  partnerId: ID;
  title: string;
  description: string;
  status: 'active' | 'resolved' | 'dormant';
  importance: number;
  lastMentioned: Date;
  relatedMemories: Memory[];
}

export class MemoryService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30秒タイムアウト
      maxRetries: 2   // 最大2回リトライ
    });
  }

  /**
   * 会話要約作成（API 6.1）
   * メッセージ群から重要な記憶を抽出してMemoryとして保存
   */
  async createSummary(request: MemorySummaryRequest): Promise<{
    success: boolean;
    memoriesCreated: Memory[];
    summaryText: string;
  }> {
    const { partnerId, messageIds, summaryType = 'daily' } = request;

    try {
      console.log(`[MemoryService] 会話要約作成開始 - Partner: ${partnerId}, Messages: ${messageIds.length}`);

      // パートナーの存在確認
      const partner = await PartnerModel.findById(partnerId);
      if (!partner) {
        throw new Error('パートナーが見つかりません');
      }

      // メッセージIDの検証
      console.log(`[MemoryService] 検索対象メッセージID: ${JSON.stringify(messageIds)}`);
      
      // 対象メッセージを取得
      const messages = await MessageModel.findByIds(messageIds);
      console.log(`[MemoryService] 取得したメッセージ数: ${messages.length}`);
      
      if (messages.length === 0) {
        console.error(`[MemoryService] メッセージが見つかりません。ID: ${JSON.stringify(messageIds)}`);
        throw new Error('対象メッセージが見つかりません');
      }

      // 会話内容を時系列順にまとめる
      const conversationText = messages
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((msg: any) => `${msg.sender === MessageSender.USER ? 'ユーザー' : partner.name}: ${msg.content}`)
        .join('\n');

      // OpenAI APIで会話分析・要約・記憶抽出
      const analysisPrompt = this.buildMemoryAnalysisPrompt(conversationText, summaryType, partner.name);
      
      const completion = await Promise.race([
        this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: analysisPrompt },
            { role: 'user', content: conversationText }
          ],
          functions: [
            {
              name: 'extract_memories',
              description: '会話から重要な記憶情報を抽出する',
              parameters: {
                type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: '会話全体の要約'
                },
                memories: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['conversation', 'fact', 'emotion', 'event', 'relationship'] },
                      content: { type: 'string' },
                      importance: { type: 'number', minimum: 1, maximum: 10 },
                      emotionalWeight: { type: 'number', minimum: 1, maximum: 10 },
                      tags: { type: 'array', items: { type: 'string' } },
                      relatedPeople: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['type', 'content', 'importance', 'emotionalWeight']
                  }
                },
                episodes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      summary: { type: 'string' },
                      emotionalWeight: { type: 'number', minimum: 0, maximum: 10 },
                      tags: { type: 'array', items: { type: 'string' } },
                      participants: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['title', 'summary', 'emotionalWeight']
                  }
                }
              },
              required: ['summary', 'memories']
            }
          }
          ],
          function_call: { name: 'extract_memories' }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI API request timeout')), 25000)
        )
      ]) as any;

      console.log('[MemoryService] OpenAI API応答:', JSON.stringify((completion as any).choices[0], null, 2));
      
      const functionCall = (completion as any).choices[0]?.message?.function_call;
      if (!functionCall) {
        console.error('[MemoryService] function_callが存在しません。応答:', completion);
        throw new Error('メモリ抽出に失敗しました: OpenAI応答にfunction_callが含まれていません');
      }

      let extractedData;
      try {
        extractedData = JSON.parse(functionCall.arguments);
        console.log('[MemoryService] OpenAI抽出データ:', JSON.stringify(extractedData, null, 2));
      } catch (parseError) {
        console.error('[MemoryService] JSON解析エラー:', parseError);
        console.error('[MemoryService] 解析対象文字列:', functionCall.arguments);
        throw new Error('メモリ抽出データの解析に失敗しました');
      }
      const memoriesCreated: Memory[] = [];

      // 抽出されたメモリを保存
      for (const memoryData of extractedData.memories) {
        console.log('[MemoryService] メモリ作成試行:', {
          type: memoryData.type,
          importance: memoryData.importance,
          emotionalWeight: memoryData.emotionalWeight
        });
        
        // ベクトル化（検索用）
        const vector = await this.generateEmbedding(memoryData.content);
        
        const memory = await MemoryModel.create({
          partnerId,
          type: memoryData.type,
          content: memoryData.content,
          vector,
          importance: memoryData.importance,
          emotionalWeight: memoryData.emotionalWeight,
          tags: memoryData.tags || [],
          relatedPeople: memoryData.relatedPeople || []
        });
        
        memoriesCreated.push(memory);

        // 重要度が高い場合は関係性メトリクスも更新
        if (memoryData.importance >= 7) {
          await RelationshipMetricsModel.incrementSharedMemories(partnerId);
        }
      }

      // エピソード記憶の保存
      if (request.summaryType === 'episode' && request.episodeTitle) {
        // 手動でエピソードを作成する場合
        await EpisodeMemoryModel.create({
          partnerId,
          title: request.episodeTitle,
          description: request.episodeDescription || extractedData.summary,
          emotionalWeight: 8, // デフォルトの高い感情的重み
          tags: extractedData.memories[0]?.tags || [],
          participants: [partner.name, 'ユーザー'],
          date: new Date()
        });
        
        // 共有メモリ数も増やす
        await RelationshipMetricsModel.incrementSharedMemories(partnerId);
      } else if (extractedData.episodes && extractedData.episodes.length > 0) {
        // 自動抽出されたエピソードの保存
        for (const episodeData of extractedData.episodes) {
          await EpisodeMemoryModel.create({
            partnerId,
            title: episodeData.title,
            description: episodeData.description,
            emotionalWeight: episodeData.emotionalWeight,
            tags: episodeData.tags || [],
            participants: episodeData.participants || [partner.name],
            date: new Date()
          });
        }
      }

      console.log(`[MemoryService] 会話要約完了 - 作成メモリ数: ${memoriesCreated.length}`);

      return {
        success: true,
        memoriesCreated,
        summaryText: extractedData.summary
      };

    } catch (error) {
      console.error('[MemoryService] 会話要約作成エラー:', error);
      console.error('[MemoryService] エラー詳細:', {
        message: (error as any).message,
        status: (error as any).status,
        response: (error as any).response?.data,
        stack: (error as any).stack
      });
      
      // OpenAI API関連エラーの詳細処理
      if ((error as any).message?.includes('timeout')) {
        throw new Error('OpenAI APIタイムアウト: リクエストが時間内に完了しませんでした');
      }
      
      if ((error as any).status === 429) {
        throw new Error('OpenAI APIレート制限: しばらく時間をおいて再試行してください');
      }
      
      if ((error as any).status === 401) {
        throw new Error('OpenAI API認証エラー: APIキーを確認してください');
      }
      
      if ((error as any).response?.data?.error) {
        throw new Error(`OpenAI APIエラー: ${(error as any).response.data.error.message}`);
      }
      
      throw new Error(`会話要約の作成に失敗しました: ${(error as any).message || '不明なエラー'}`);
    }
  }

  /**
   * メモリ検索（API 6.2）
   * ベクトル検索とキーワード検索を組み合わせた高度なメモリ検索
   */
  async searchMemories(request: MemorySearchRequest): Promise<{
    results: Memory[];
    relevanceScores: number[];
    totalFound: number;
  }> {
    const { partnerId, query, memoryTypes, limit = 20, minImportance = 0 } = request;

    try {
      console.log(`[MemoryService] メモリ検索開始 - Query: "${query}"`);

      // 検索クエリをベクトル化
      const queryVector = await this.generateEmbedding(query);

      // 基本的なメモリ取得
      let memories: Memory[];
      if (memoryTypes && memoryTypes.length > 0) {
        memories = await MemoryModel.findByImportanceAndType(partnerId, minImportance, memoryTypes);
      } else {
        memories = await MemoryModel.findByPartnerId(partnerId, 200); // 多めに取得してフィルタ
      }

      // ベクトル類似度計算
      const scoredMemories = memories.map(memory => {
        let relevanceScore = 0;

        // ベクトル類似度（コサイン類似度）
        if (memory.vector && queryVector) {
          relevanceScore += this.calculateCosineSimilarity(memory.vector, queryVector) * 0.6;
        }

        // キーワードマッチング
        const contentLower = memory.content.toLowerCase();
        const queryLower = query.toLowerCase();
        if (contentLower.includes(queryLower)) {
          relevanceScore += 0.3;
        }

        // タグマッチング
        const queryWords = queryLower.split(/\s+/);
        const tagMatches = memory.tags.filter(tag => 
          queryWords.some(word => tag.toLowerCase().includes(word))
        ).length;
        relevanceScore += (tagMatches / Math.max(memory.tags.length, 1)) * 0.1;

        // 重要度ボーナス
        relevanceScore += (memory.importance / 10) * 0.1;

        return { memory, relevanceScore };
      });

      // スコア順でソート・フィルタ
      const sortedResults = scoredMemories
        .filter(item => item.relevanceScore > 0.1) // 最低類似度閾値
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      const results = sortedResults.map(item => item.memory);
      const relevanceScores = sortedResults.map(item => item.relevanceScore);

      console.log(`[MemoryService] メモリ検索完了 - 結果数: ${results.length}`);

      return {
        results,
        relevanceScores,
        totalFound: scoredMemories.filter(item => item.relevanceScore > 0.1).length
      };

    } catch (error) {
      console.error('[MemoryService] メモリ検索エラー:', error);
      throw new Error('メモリ検索に失敗しました');
    }
  }

  /**
   * エピソード記憶取得（API 6.3）
   */
  async getEpisodes(
    partnerId: ID, 
    options: {
      limit?: number;
      minEmotionalWeight?: number;
      tags?: string[];
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<EpisodeMemory[]> {
    const { limit = 20, minEmotionalWeight, tags, startDate, endDate } = options;

    try {
      console.log(`[MemoryService] エピソード記憶取得開始 - Partner: ${partnerId}`);

      let episodes: EpisodeMemory[];

      if (startDate && endDate) {
        episodes = await EpisodeMemoryModel.findByDateRange(partnerId, startDate, endDate);
      } else if (tags && tags.length > 0) {
        episodes = await EpisodeMemoryModel.findByTags(partnerId, tags);
      } else if (minEmotionalWeight !== undefined) {
        episodes = await EpisodeMemoryModel.findByEmotionalWeight(partnerId, minEmotionalWeight, limit);
      } else {
        episodes = await EpisodeMemoryModel.findByPartnerId(partnerId, limit);
      }

      console.log(`[MemoryService] エピソード記憶取得完了 - 件数: ${episodes.length}`);

      return episodes;

    } catch (error) {
      console.error('[MemoryService] エピソード記憶取得エラー:', error);
      throw new Error('エピソード記憶の取得に失敗しました');
    }
  }

  /**
   * 関係性メトリクス取得（API 6.4）
   */
  async getRelationshipMetrics(
    partnerId: ID,
    options: {
      includeHistory?: boolean;
      period?: 'week' | 'month' | 'quarter' | 'year' | 'all';
    } = {}
  ): Promise<{
    current: RelationshipMetrics | null;
    stage: string;
    insights: string[];
    recommendations: string[];
  }> {
    try {
      console.log(`[MemoryService] 関係性メトリクス取得開始 - Partner: ${partnerId}`);

      const metrics = await RelationshipMetricsModel.findByPartnerId(partnerId);
      
      if (!metrics) {
        // 関係性メトリクスが存在しない場合は作成を試行
        try {
          const newMetrics = await RelationshipMetricsModel.create(partnerId);
          return {
            current: newMetrics,
            stage: RelationshipMetricsModel.getRelationshipStage(newMetrics),
            insights: ['新しい関係が始まりました'],
            recommendations: ['定期的にコミュニケーションを取りましょう']
          };
        } catch (createError) {
          console.warn('[MemoryService] 関係性メトリクス作成失敗 - デフォルト値を返します:', (createError as any).message);
          // パートナーが存在しない場合はデフォルト値を返す
          return {
            current: null,
            stage: 'stranger',
            insights: ['関係性データが見つかりません'],
            recommendations: ['まずはパートナーとの会話を始めましょう']
          };
        }
      }

      const stage = RelationshipMetricsModel.getRelationshipStage(metrics);
      const insights = await this.generateRelationshipInsights(metrics);
      const recommendations = await this.generateRelationshipRecommendations(metrics, partnerId);

      console.log(`[MemoryService] 関係性メトリクス取得完了 - Stage: ${stage}`);

      return {
        current: metrics,
        stage,
        insights,
        recommendations
      };

    } catch (error) {
      console.error('[MemoryService] 関係性メトリクス取得エラー:', error);
      throw new Error('関係性メトリクスの取得に失敗しました');
    }
  }

  /**
   * 継続話題取得（API 6.5）
   */
  async getOngoingTopics(
    partnerId: ID,
    options: {
      limit?: number;
      status?: 'active' | 'resolved' | 'dormant' | 'all';
      minImportance?: number;
    } = {}
  ): Promise<OngoingTopic[]> {
    const { limit = 10, status = 'active', minImportance = 3 } = options;

    try {
      console.log(`[MemoryService] 継続話題取得開始 - Partner: ${partnerId}`);

      // 重要度の高いメモリから話題を抽出
      const memories = await MemoryModel.findByImportanceAndType(
        partnerId, 
        minImportance, 
        [MemoryType.CONVERSATION, MemoryType.PREFERENCE, MemoryType.RELATIONSHIP]
      );

      // OpenAI APIで話題クラスタリング
      const topics = await this.extractOngoingTopics(memories, status);

      const filteredTopics = topics.slice(0, limit);

      console.log(`[MemoryService] 継続話題取得完了 - 話題数: ${filteredTopics.length}`);

      return filteredTopics;

    } catch (error) {
      console.error('[MemoryService] 継続話題取得エラー:', error);
      throw new Error('継続話題の取得に失敗しました');
    }
  }

  // ===== プライベートメソッド =====

  /**
   * テキストをベクトル化（OpenAI Embeddings使用）
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await Promise.race([
        this.openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: text
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenAI Embeddings API timeout')), 15000)
        )
      ]);
      
      return (response as any).data[0].embedding;
    } catch (error) {
      console.error('[MemoryService] ベクトル化エラー:', error);
      
      // OpenAI API関連エラーの詳細ログ
      if ((error as any).message?.includes('timeout')) {
        console.warn('[MemoryService] OpenAI Embeddings APIタイムアウト - ベクトル検索をスキップ');
      } else if ((error as any).status === 429) {
        console.warn('[MemoryService] OpenAI APIレート制限 - ベクトル検索をスキップ');
      } else if ((error as any).status === 401) {
        console.error('[MemoryService] OpenAI API認証エラー - APIキーを確認してください');
      }
      
      // ベクトル化に失敗した場合は空配列を返してテキスト検索のみ実行
      return [];
    }
  }

  /**
   * コサイン類似度計算
   */
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) return 0;
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * メモリ分析用プロンプト構築
   */
  private buildMemoryAnalysisPrompt(conversationText: string, summaryType: string, partnerName: string): string {
    return `あなたは高度なメモリ管理AIです。会話から重要な記憶情報を抽出してください。

パートナー名: ${partnerName}
要約タイプ: ${summaryType}

以下の観点で会話を分析してください：
1. 重要な事実や出来事
2. 感情的な瞬間や親密度の変化
3. 個人的な好み・趣味・価値観
4. 人間関係や社会的つながり
5. 継続的な話題や未解決の問題

メモリタイプ:
- CONVERSATION: 一般的な会話内容
- EPISODE: 特別な出来事や体験
- RELATIONSHIP: 人間関係の情報
- EMOTION: 感情に関する情報
- PREFERENCE: 好みや選択

重要度（0-10）:
- 0-3: 日常的な情報
- 4-6: 意味のある情報
- 7-8: 重要な情報
- 9-10: 極めて重要な情報

感情重み（-10〜+10）:
- 負の値: ネガティブな感情
- 正の値: ポジティブな感情
- 0: 中立的`;
  }

  /**
   * 関係性に基づく洞察生成
   */
  private async generateRelationshipInsights(metrics: RelationshipMetrics): Promise<string[]> {
    const insights: string[] = [];
    
    if (metrics.intimacyLevel > 70) {
      insights.push('非常に親密な関係に発展しています');
    } else if (metrics.intimacyLevel > 50) {
      insights.push('信頼関係が構築されています');
    } else if (metrics.intimacyLevel < 20) {
      insights.push('関係の構築に時間が必要です');
    }
    
    if (metrics.conversationFrequency > 100) {
      insights.push('活発なコミュニケーションが続いています');
    }
    
    if (metrics.sharedMemories > 50) {
      insights.push('多くの共有体験があります');
    }
    
    return insights;
  }

  /**
   * 関係性改善の推奨事項生成
   */
  private async generateRelationshipRecommendations(metrics: RelationshipMetrics, partnerId: ID): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (metrics.intimacyLevel < 50) {
      recommendations.push('もっと個人的な話題について話してみましょう');
    }
    
    
    return recommendations;
  }

  /**
   * 継続話題の抽出
   */
  private async extractOngoingTopics(memories: Memory[], status: string): Promise<OngoingTopic[]> {
    // 実装上は、メモリからトピックをクラスタリングして継続話題を特定
    // この例では簡略化したバージョンを返す
    const topics: OngoingTopic[] = [];
    
    // メモリをタグでグループ化
    const tagGroups = new Map<string, Memory[]>();
    memories.forEach(memory => {
      memory.tags.forEach(tag => {
        if (!tagGroups.has(tag)) {
          tagGroups.set(tag, []);
        }
        tagGroups.get(tag)!.push(memory);
      });
    });
    
    // タググループから話題を生成
    let topicId = 1;
    for (const [tag, relatedMemories] of tagGroups) {
      if (relatedMemories.length >= 2) { // 最低2つのメモリが関連している話題
        const avgImportance = relatedMemories.reduce((sum, m) => sum + m.importance, 0) / relatedMemories.length;
        const lastMentioned = new Date(Math.max(...relatedMemories.map(m => new Date(m.createdAt || new Date()).getTime())));
        
        topics.push({
          id: `topic-${topicId++}`,
          partnerId: memories[0].partnerId,
          title: tag,
          description: `${tag}に関する継続的な話題`,
          status: this.determineTopicStatus(lastMentioned),
          importance: avgImportance,
          lastMentioned,
          relatedMemories
        });
      }
    }
    
    return topics.filter(topic => status === 'all' || topic.status === status);
  }

  /**
   * 話題のステータス判定
   */
  private determineTopicStatus(lastMentioned: Date): 'active' | 'resolved' | 'dormant' {
    const daysSince = (Date.now() - lastMentioned.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSince < 7) return 'active';
    if (daysSince < 30) return 'dormant';
    return 'resolved';
  }
}

export default MemoryService;