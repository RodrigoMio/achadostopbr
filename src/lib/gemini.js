import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { config, getGeminiModelCandidates, isGeminiConfigured } from './config.js';

const INVALID_AI_RESPONSE = 'Resposta da IA inválida.';
const GEMINI_RETRY_ATTEMPTS = 3;
const GEMINI_RETRYABLE = /503|429|500|Service Unavailable|RESOURCE_EXHAUSTED|high demand/i;
const GEMINI_MODEL_GONE =
  /404|not found|no longer|not supported|is not found for API version/i;

const GENERATION_CONFIG = {
  temperature: 0.7,
  responseMimeType: 'application/json',
  responseSchema: {
    type: SchemaType.OBJECT,
    properties: {
      Titulo: { type: SchemaType.STRING },
      Descricao: { type: SchemaType.STRING },
    },
    required: ['Titulo', 'Descricao'],
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(message) {
  return GEMINI_RETRYABLE.test(message);
}

function isModelUnavailableError(message) {
  return GEMINI_MODEL_GONE.test(message);
}

function allModelsFailedError(triedModels) {
  const list = triedModels.join(', ');
  return new Error(
    `Nenhum modelo Gemini respondeu (${list}). A API exige um model ID em cada chamada — não há "versão da chave". Liste os modelos da sua chave com GET https://generativelanguage.googleapis.com/v1beta/models?key=SUA_CHAVE e ajuste GEMINI_MODEL (ex.: gemini-3.6-flash ou gemini-3.5-flash-lite).`,
  );
}

async function generateContentTextForModel(genAI, modelId, prompt) {
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: GENERATION_CONFIG,
  });

  let lastError;
  for (let attempt = 1; attempt <= GEMINI_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastError = err;
      const message = err?.message || '';
      if (attempt < GEMINI_RETRY_ATTEMPTS && isRetryableGeminiError(message)) {
        await sleep(1000 * attempt);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

async function generateContentText(genAI, prompt) {
  const candidates = getGeminiModelCandidates();
  const tried = [];
  let lastMessage = '';

  for (const modelId of candidates) {
    tried.push(modelId);
    try {
      const text = await generateContentTextForModel(genAI, modelId, prompt);
      return text;
    } catch (err) {
      lastMessage = err?.message || String(err);
      if (isModelUnavailableError(lastMessage) || isRetryableGeminiError(lastMessage)) {
        continue;
      }
      throw err instanceof Error ? err : new Error(lastMessage);
    }
  }

  if (isModelUnavailableError(lastMessage)) {
    throw new Error(
      `Modelo "${config.geminiModel}" indisponível para geração (descontinuado ou restrito). Tente GEMINI_MODEL=gemini-3.6-flash ou gemini-3.5-flash-lite.`,
    );
  }

  throw allModelsFailedError(tried);
}

function clip(value, max) {
  if (value == null) return '';
  const text = String(value).trim();
  return text.length > max ? text.slice(0, max).trim() : text;
}

function stripMarkdownFence(text) {
  if (!text) return '';
  let cleaned = String(text).trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
  }
  return cleaned;
}

function parseAiProductPayload(rawText) {
  const cleaned = stripMarkdownFence(rawText);
  if (!cleaned) {
    throw new Error(INVALID_AI_RESPONSE);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(INVALID_AI_RESPONSE);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(INVALID_AI_RESPONSE);
  }

  const { Titulo, Descricao } = parsed;
  if (typeof Titulo !== 'string' || typeof Descricao !== 'string') {
    throw new Error(INVALID_AI_RESPONSE);
  }

  return {
    title: clip(Titulo, 100),
    description: clip(Descricao, 1500),
  };
}

export async function generateProductFromUserPrompt({
  userPrompt,
  productLink,
  imageLink,
  affiliatedLink,
  category,
  platform,
}) {
  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_API_KEY não configurado.');
  }

  if (!productLink?.trim()) {
    throw new Error('Link do produto é obrigatório para gerar o texto.');
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);

  const optionalContext = [
    category ? `- Categoria: ${category}` : null,
    platform ? `- Plataforma: ${platform}` : null,
    imageLink ? `- URL da imagem: ${imageLink}` : null,
    affiliatedLink ? `- Link de afiliado: ${affiliatedLink}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const fullPrompt = `${userPrompt.trim()}

Link do produto (obrigatório para extrair o nome):
${productLink.trim()}
${optionalContext ? `\nContexto adicional (opcional):\n${optionalContext}` : ''}`;

  const rawText = await generateContentText(genAI, fullPrompt);
  return parseAiProductPayload(rawText);
}
