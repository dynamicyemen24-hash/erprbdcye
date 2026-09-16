import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import os from 'os';
import { getConfig, resetConfig } from '../../config/env';
import { MODEL_REGISTRY } from '../../ai/router';

const router = Router();

// ... existing info and features routes ...

// AI Model Management Routes
router.get('/ai/model', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req: Request, res: Response) => {
  const config = getConfig();
  res.json({
    selectedModel: config.ai?.selectedModel || 'gemini-2.5-flash',
    apiKeyConfigured: !!(config.ai?.apiKey || process.env.GEMINI_API_KEY),
    modelProvider: config.ai?.modelProvider || 'google',
    enabled: config.ai?.enabled || false,
    modelTier: config.ai?.modelTier || '',
    fallback: {
      model: config.ai?.fallbackModel || 'gemini-2.5-flash',
      provider: config.ai?.fallbackProvider || 'google'
    }
  });
});

router.post('/ai/model', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req: Request, res: Response) => {
  const { selectedModel, modelProvider, apiKey, modelTier, fallbackModel, fallbackProvider } = req.body;

  // Validate model exists in registry or is supported
  const validProviders: ('google' | 'anthropic' | 'openai' | 'local')[] = ['google', 'anthropic', 'openai', 'local'];
  if (modelProvider && !validProviders.includes(modelProvider)) {
    return res.status(400).json({ error: `Invalid model provider: ${modelProvider}` });
  }

  // Set environment variables (in-memory for this session, persist via .env in production)
  if (selectedModel) {
    // Note: In a real production system, you'd want to persist to a config file/database
    // For now, we update the process env and reload config
    process.env.AI_MODEL = selectedModel;
  }
  if (modelProvider) {
    process.env.AI_PROVIDER = modelProvider;
  }
  if (apiKey) {
    process.env.AI_API_KEY = apiKey;
  }
  if (fallbackModel) {
    process.env.AI_FALLBACK_MODEL = fallbackModel;
  }
  if (fallbackProvider) {
    process.env.AI_FALLBACK_PROVIDER = fallbackProvider;
  }

  // Reload config to pick up new values
  resetConfig();

  res.json({
    success: true,
    message: 'AI model configuration updated',
    selectedModel,
    modelProvider,
    // Don't return the full API key for security
    configUpdated: true
  });
});

router.get('/ai/models', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req: Request, res: Response) => {
  const supportedModels = Object.keys(MODEL_REGISTRY).map(modelId => ({
    id: modelId,
    name: modelId,
    provider: MODEL_REGISTRY[modelId].provider,
    costPer1kTokens: MODEL_REGISTRY[modelId].costPer1kTokens,
    maxTokens: MODEL_REGISTRY[modelId].maxTokens,
    capabilities: MODEL_REGISTRY[modelId].capabilities,
    complexity: MODEL_REGISTRY[modelId].complexity,
    latencyTierMs: MODEL_REGISTRY[modelId].latencyTierMs
  }));

  // Group by provider
  const grouped = supportedModels.reduce((acc, model) => {
    const provider = model.provider as string;
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, typeof supportedModels>);

  res.json({
    totalModels: supportedModels.length,
    providers: Object.keys(grouped),
    models: grouped
  });
});

// Keep existing routes
router.get('/info', authenticateToken, requireRole('ADMIN', 'SUPER_ADMIN'), (req: Request, res: Response) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    node: process.version,
    platform: os.platform(),
    arch: os.arch(),
    memory: {
      total: Math.round(os.totalmem() / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024),
      used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || 'unknown',
      load: os.loadavg(),
    },
    pid: process.pid,
    cwd: process.cwd(),
  });
});

router.get('/features', authenticateToken, (req: Request, res: Response) => {
  res.json({
    features: {
      email: process.env.EMAIL_PROVIDER || 'console',
      redis: process.env.REDIS_URL ? 'configured' : 'in-memory',
      ai: process.env.GEMINI_API_KEY ? 'configured' : 'mock',
      webhooks: true,
      queue: true,
      observability: true,
      mfa: 'totp-enforced',
      sso: false,
    },
  });
});

export default router;
