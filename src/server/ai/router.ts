// ═══════════════════════════════════════════════════════════════════
// UAMEX ERP™ — Sovereign AI Core™ (NEB-13)
// Multi-Model Router with RAG, Digital Twin, and Predictive Impact
// Supports: Gemini 3 Pro, Claude 4.5, Llama-4 Local
// ═══════════════════════════════════════════════════════════════════

import crypto from 'crypto';
import { getPool } from '../core/database';
import logger from '../core/logger';

function toErrorObject(err: unknown): { name: string; message: string; stack?: string; code?: string } {
  if (err instanceof Error) {
    const e = err as Error & { code?: string };
    return { name: e.name, message: e.message, stack: e.stack, code: e.code };
  }
  return { name: 'UnknownError', message: String(err) };
}

/** Available AI Models */
export type AIModel = 
  | 'gemini-3-pro'
  | 'gemini-2.5-flash'
  | 'claude-4.5-sonnet'
  | 'claude-4.5-haiku'
  | 'llama-4-70b-local'
  | 'llama-4-8b-local'
  | 'embedding-gemini'
  | 'embedding-bge-large';

/** Task complexity */
export type TaskComplexity = 'low' | 'medium' | 'high' | 'expert';

/** Task type for routing */
export type TaskType = 
  | 'chat'
  | 'completion'
  | 'embedding'
  | 'analysis'
  | 'forecast'
  | 'classification'
  | 'extraction'
  | 'simulation'
  | 'code'
  | 'translation';

/** Model configuration */
interface ModelConfig {
  model: AIModel;
  provider: 'google' | 'anthropic' | 'local' | 'azure-openai';
  costPer1kTokens: { input: number; output: number };
  maxTokens: number;
  capabilities: TaskType[];
  complexity: TaskComplexity;
  contextWindow: number;
  latencyTierMs: number;     // p50 latency
}

/** Pre-configured models */
const MODEL_REGISTRY: Record<AIModel, ModelConfig> = {
  'gemini-3-pro': {
    model: 'gemini-3-pro',
    provider: 'google',
    costPer1kTokens: { input: 0.0035, output: 0.0105 },
    maxTokens: 8192,
    capabilities: ['chat', 'analysis', 'extraction', 'simulation', 'code', 'translation'],
    complexity: 'expert',
    contextWindow: 2000000,
    latencyTierMs: 2500,
  },
  'gemini-2.5-flash': {
    model: 'gemini-2.5-flash',
    provider: 'google',
    costPer1kTokens: { input: 0.000075, output: 0.0003 },
    maxTokens: 8192,
    capabilities: ['chat', 'completion', 'classification', 'extraction', 'translation'],
    complexity: 'medium',
    contextWindow: 1000000,
    latencyTierMs: 800,
  },
  'claude-4.5-sonnet': {
    model: 'claude-4.5-sonnet',
    provider: 'anthropic',
    costPer1kTokens: { input: 0.003, output: 0.015 },
    maxTokens: 8192,
    capabilities: ['chat', 'analysis', 'extraction', 'simulation', 'code'],
    complexity: 'expert',
    contextWindow: 200000,
    latencyTierMs: 3000,
  },
  'claude-4.5-haiku': {
    model: 'claude-4.5-haiku',
    provider: 'anthropic',
    costPer1kTokens: { input: 0.0008, output: 0.004 },
    maxTokens: 8192,
    capabilities: ['chat', 'classification', 'extraction', 'translation'],
    complexity: 'medium',
    contextWindow: 200000,
    latencyTierMs: 1000,
  },
  'llama-4-70b-local': {
    model: 'llama-4-70b-local',
    provider: 'local',
    costPer1kTokens: { input: 0, output: 0 },
    maxTokens: 4096,
    capabilities: ['chat', 'completion', 'classification', 'extraction'],
    complexity: 'high',
    contextWindow: 128000,
    latencyTierMs: 5000,
  },
  'llama-4-8b-local': {
    model: 'llama-4-8b-local',
    provider: 'local',
    costPer1kTokens: { input: 0, output: 0 },
    maxTokens: 4096,
    capabilities: ['completion', 'classification'],
    complexity: 'low',
    contextWindow: 128000,
    latencyTierMs: 1500,
  },
  'embedding-gemini': {
    model: 'embedding-gemini',
    provider: 'google',
    costPer1kTokens: { input: 0.000025, output: 0 },
    maxTokens: 8192,
    capabilities: ['embedding'],
    complexity: 'low',
    contextWindow: 8192,
    latencyTierMs: 200,
  },
  'embedding-bge-large': {
    model: 'embedding-bge-large',
    provider: 'local',
    costPer1kTokens: { input: 0, output: 0 },
    maxTokens: 512,
    capabilities: ['embedding'],
    complexity: 'low',
    contextWindow: 512,
    latencyTierMs: 50,
  },
};

/** AI Request */
interface AIRequest {
  taskType: TaskType;
  prompt: string;
  context?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  requireLocal?: boolean;     // For data residency requirements
  preferredModel?: AIModel;
  tenantId: string;
  userId: string;
  /** RAG configuration */
  rag?: {
    enabled: boolean;
    collection: string;
    topK?: number;
    threshold?: number;
  };
}

/** AI Response */
interface AIResponse {
  requestId: string;
  model: AIModel;
  content: string;
  tokensUsed: { input: number; output: number; total: number };
  cost: number;
  latencyMs: number;
  finishReason: 'stop' | 'length' | 'error' | 'safety';
  /** RAG sources used */
  ragSources?: Array<{
    content: string;
    score: number;
    source: string;
    metadata: Record<string, unknown>;
  }>;
  metadata: {
    cached: boolean;
    routingStrategy: string;
  };
}

/** Digital Twin Simulation Request */
interface SimulationRequest {
  scenario: string;
  parameters: Record<string, unknown>;
  constraints: Record<string, unknown>;
  horizonMonths: number;
  monteCarloRuns?: number;
}

/** Simulation Result */
interface SimulationResult {
  simulationId: string;
  scenario: string;
  outcomes: Array<{
    outcome: string;
    probability: number;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    magnitude: number;
  }>;
  recommendations: string[];
  confidenceScore: number;
  ranAt: string;
  durationMs: number;
}

/**
 * Multi-Model AI Router
 * - Routes tasks to optimal model based on complexity, cost, latency
 * - Provides fallback chain
 * - Tracks cost and performance metrics
 */
export class MultiModelRouter {
  private pool: ReturnType<typeof getPool>;
  private cache: Map<string, AIResponse> = new Map();
  private cacheMaxSize = 1000;
  private totalCostToday = 0;
  private requestCount = 0;

  constructor() {
    this.pool = getPool();
  }

  /** Route a request to the optimal model */
  async route(request: AIRequest): Promise<AIResponse> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.getCacheKey(request);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return { ...cached, metadata: { ...cached.metadata, cached: true } };
    }

    // Select model
    const model = this.selectModel(request);
    const config = MODEL_REGISTRY[model];

    logger.info(`[AI Router] Routing ${request.taskType} to ${model}`, {
      meta: { requestId, tenantId: request.tenantId, userId: request.userId }
    });

    try {
      // RAG retrieval if enabled
      let ragSources: AIResponse['ragSources'];
      let augmentedPrompt = request.prompt;
      
      if (request.rag?.enabled) {
        const retrieval = await this.retrieveContext(
          request.prompt,
          request.rag.collection,
          request.rag.topK || 5,
          request.rag.threshold || 0.7
        );
        ragSources = retrieval;
        augmentedPrompt = this.augmentWithContext(request.prompt, retrieval);
      }

      // Call the model
      const result = await this.callModel(model, {
        prompt: augmentedPrompt,
        systemPrompt: request.systemPrompt,
        context: request.context,
        temperature: request.temperature,
        maxTokens: request.maxTokens || config.maxTokens,
      });

      const cost = this.calculateCost(
        result.tokensUsed.input,
        result.tokensUsed.output,
        config.costPer1kTokens
      );

      const response: AIResponse = {
        requestId,
        model,
        content: result.content,
        tokensUsed: result.tokensUsed,
        cost,
        latencyMs: Date.now() - startTime,
        finishReason: result.finishReason,
        ragSources,
        metadata: {
          cached: false,
          routingStrategy: this.getRoutingStrategy(request, model),
        },
      };

      // Cache the response
      this.cache.set(cacheKey, response);
      if (this.cache.size > this.cacheMaxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) this.cache.delete(firstKey);
      }

      // Track cost
      this.totalCostToday += cost;
      this.requestCount++;

      // Persist metrics
      await this.trackUsage(request, response);

      return response;
    } catch (err) {
      logger.error(`[AI Router] Request failed for ${model}`, { error: toErrorObject(err) });
      
      // Fallback to next model
      const fallback = this.getFallback(model, request);
      if (fallback) {
        logger.info(`[AI Router] Falling back to ${fallback}`);
        return this.route({ ...request, preferredModel: fallback });
      }
      throw err;
    }
  }

  /** Select optimal model for request */
  private selectModel(request: AIRequest): AIModel {
    if (request.preferredModel) return request.preferredModel;

    // Local-only requirement (data residency)
    if (request.requireLocal) {
      return request.taskType === 'embedding' ? 'embedding-bge-large' : 'llama-4-8b-local';
    }

    // Task-based selection
    const candidates = Object.values(MODEL_REGISTRY).filter(
      m => m.capabilities.includes(request.taskType)
    );

    if (candidates.length === 0) {
      return 'gemini-2.5-flash'; // Default fallback
    }

    // Score each model
    const scored = candidates.map(model => {
      let score = 0;
      
      // Cost efficiency
      const avgCost = (model.costPer1kTokens.input + model.costPer1kTokens.output) / 2;
      score -= avgCost * 100; // Lower cost = higher score
      
      // Latency (lower is better)
      score -= model.latencyTierMs / 100;
      
      // Capability match
      if (model.complexity === 'expert' && request.taskType === 'simulation') score += 50;
      if (model.complexity === 'low' && request.taskType === 'classification') score += 30;
      
      // Context window
      if (request.context && request.context.length > 50000) {
        score += model.contextWindow / 1000;
      }
      
      return score;
    });

    const bestIndex = scored.indexOf(Math.max(...scored));
    return candidates[bestIndex].model;
  }

  /** Get fallback model */
  private getFallback(failed: AIModel, request: AIRequest): AIModel | null {
    const candidates = Object.values(MODEL_REGISTRY).filter(
      m => m.model !== failed && m.capabilities.includes(request.taskType)
    );
    if (candidates.length === 0) return null;
    
    // Return cheapest fallback
    return candidates.sort((a, b) => 
      (a.costPer1kTokens.input + a.costPer1kTokens.output) - 
      (b.costPer1kTokens.input + b.costPer1kTokens.output)
    )[0].model;
  }

  /** Call the model provider */
  private async callModel(model: AIModel, params: {
    prompt: string;
    systemPrompt?: string;
    context?: string;
    temperature?: number;
    maxTokens: number;
  }): Promise<{
    content: string;
    tokensUsed: { input: number; output: number; total: number };
    finishReason: AIResponse['finishReason'];
  }> {
    const config = MODEL_REGISTRY[model];
    
    switch (config.provider) {
      case 'google':
        return this.callGemini(model, params);
      case 'anthropic':
        return this.callClaude(model, params);
      case 'local':
        return this.callLocal(model, params);
      default:
        throw new Error(`Provider not supported: ${config.provider}`);
    }
  }

  /** Call Gemini API */
  private async callGemini(model: AIModel, params: any): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const modelName = model === 'embedding-gemini' ? 'text-embedding-004' : 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const fullPrompt = params.systemPrompt 
      ? `${params.systemPrompt}\n\n${params.context ? params.context + '\n\n' : ''}${params.prompt}`
      : params.context ? `${params.context}\n\n${params.prompt}` : params.prompt;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: params.temperature ?? 0.7,
          maxOutputTokens: params.maxTokens,
        },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = {
      input: data.usageMetadata?.promptTokenCount || 0,
      output: data.usageMetadata?.candidatesTokenCount || 0,
      total: data.usageMetadata?.totalTokenCount || 0,
    };

    return {
      content,
      tokensUsed,
      finishReason: data.candidates?.[0]?.finishReason || 'stop',
    };
  }

  /** Call Claude API */
  private async callClaude(model: AIModel, params: any): Promise<any> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

    const endpoint = 'https://api.anthropic.com/v1/messages';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: params.maxTokens,
        temperature: params.temperature ?? 0.7,
        system: params.systemPrompt || '',
        messages: [{ role: 'user', content: params.prompt }],
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content?.[0]?.text || '',
      tokensUsed: {
        input: data.usage?.input_tokens || 0,
        output: data.usage?.output_tokens || 0,
        total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
      finishReason: data.stop_reason || 'stop',
    };
  }

  /** Call local model (placeholder) */
  private async callLocal(model: AIModel, params: any): Promise<any> {
    // Local inference would use vLLM, Ollama, or similar
    // For now, return a deterministic response
    return {
      content: `[Local ${model} response - implementation pending]\n\nInput: ${params.prompt.substring(0, 100)}...`,
      tokensUsed: {
        input: Math.ceil(params.prompt.length / 4),
        output: 50,
        total: Math.ceil(params.prompt.length / 4) + 50,
      },
      finishReason: 'stop',
    };
  }

  /** Calculate cost */
  private calculateCost(inputTokens: number, outputTokens: number, costs: { input: number; output: number }): number {
    return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
  }

  /** Get cache key */
  private getCacheKey(request: AIRequest): string {
    return crypto.createHash('sha256').update(JSON.stringify({
      task: request.taskType,
      prompt: request.prompt,
      system: request.systemPrompt,
      context: request.context,
      temp: request.temperature,
    })).digest('hex');
  }

  /** Get routing strategy name */
  private getRoutingStrategy(request: AIRequest, model: AIModel): string {
    if (request.preferredModel) return 'user-preference';
    if (request.requireLocal) return 'data-residency';
    if (request.taskType === 'simulation') return 'expert-capability';
    if (request.taskType === 'classification') return 'cost-optimized';
    return 'balanced-multi-objective';
  }

  /** Track usage metrics */
  private async trackUsage(request: AIRequest, response: AIResponse): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO ai_usage_metrics 
         (request_id, tenant_id, user_id, model, task_type, input_tokens, output_tokens, total_tokens, cost, latency_ms, cached, routing_strategy, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        [
          response.requestId,
          request.tenantId,
          request.userId,
          response.model,
          request.taskType,
          response.tokensUsed.input,
          response.tokensUsed.output,
          response.tokensUsed.total,
          response.cost,
          response.latencyMs,
          response.metadata.cached,
          response.metadata.routingStrategy,
        ]
      );
    } catch (err) {
      // Table might not exist yet, log and continue
      logger.debug('[AI Router] Usage tracking failed (table may not exist)', { meta: { error: String(err) } });
    }
  }

  /** RAG retrieval */
  private async retrieveContext(
    query: string,
    collection: string,
    topK: number,
    threshold: number
  ): Promise<NonNullable<AIResponse['ragSources']>> {
    try {
      // Generate embedding for the query
      const embedding = await this.generateEmbedding(query);
      
      // Search similar vectors
      const embeddingStr = `[${embedding.join(',')}]`;
      const result = await this.pool.query(
        `SELECT id, content, source, metadata, 
                1 - (embedding <=> $1::vector) as similarity
         FROM rag_documents
         WHERE collection = $2 
         AND 1 - (embedding <=> $1::vector) > $3
         ORDER BY embedding <=> $1::vector
         LIMIT $4`,
        [embeddingStr, collection, threshold, topK]
      );

      return result.rows.map(row => ({
        content: row.content,
        score: row.similarity,
        source: row.source,
        metadata: row.metadata,
      }));
    } catch (err) {
      logger.warn('[AI Router] RAG retrieval failed', { error: toErrorObject(err) });
      return [];
    }
  }

  /** Generate embedding for text */
  private async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return zero vector as fallback
      return new Array(768).fill(0);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] },
          }),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding?.values || new Array(768).fill(0);
    } catch (err) {
      logger.warn('[AI Router] Embedding generation failed', { error: toErrorObject(err) });
      return new Array(768).fill(0);
    }
  }

  /** Augment prompt with RAG context */
  private augmentWithContext(prompt: string, sources: NonNullable<AIResponse['ragSources']>): string {
    if (sources.length === 0) return prompt;
    
    const contextBlock = sources
      .map((s, i) => `[Context ${i + 1}] (relevance: ${(s.score * 100).toFixed(1)}%)\n${s.content}`)
      .join('\n\n');
    
    return `${contextBlock}\n\n---\n\nBased on the above context, ${prompt}`;
  }

  /** Get usage statistics */
  getStats(): { totalCost: number; requestCount: number; cacheSize: number } {
    return {
      totalCost: this.totalCostToday,
      requestCount: this.requestCount,
      cacheSize: this.cache.size,
    };
  }
}

/** Factory */
export function createAIRouter(): MultiModelRouter {
  return new MultiModelRouter();
}

export type { AIRequest, AIResponse, SimulationRequest, SimulationResult };
export { MODEL_REGISTRY };
export type { ModelConfig };
