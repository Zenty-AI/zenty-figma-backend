'use strict';

const { errors } = require('@strapi/utils');

const { ApplicationError, ValidationError } = errors;

const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b';
const PERSONAL_QUESTION_UID = 'api::plugin-question-memory.plugin-question-memory';
const GLOBAL_QUESTION_UID = 'api::plugin-question-global-memory.plugin-question-global-memory';

module.exports = ({ strapi } = {}) => {
  const normalizeOllamaUrl = (value) => {
    const rawValue = typeof value === 'string' && value.trim() ? value.trim() : DEFAULT_OLLAMA_URL;

    try {
      const url = new URL(rawValue.replace(/\/+$/u, ''));

      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Unsupported Ollama protocol.');
      }

      if (url.pathname.endsWith('/api')) {
        url.pathname = url.pathname.slice(0, -4) || '/';
      }

      return url.toString().replace(/\/+$/u, '');
    } catch (_error) {
      throw new ValidationError('Invalid Ollama URL.');
    }
  };

  const resolveModel = (model) =>
    typeof model === 'string' && model.trim() ? model.trim() : DEFAULT_OLLAMA_MODEL;

  const getOllamaApiUrl = (normalizedOllamaUrl, endpoint) => `${normalizedOllamaUrl}/api/${endpoint}`;

  const getModelName = (model) => compactString(model?.name || model?.model);

  const modelMatchesFamily = (model, family) => {
    const name = getModelName(model);
    const families = Array.isArray(model?.details?.families) ? model.details.families : [];

    return (
      name === family ||
      name.startsWith(`${family}:`) ||
      model?.details?.family === family ||
      families.includes(family)
    );
  };

  const resolveInstalledModel = async ({ normalizedOllamaUrl, requestedModel }) => {
    try {
      const response = await fetch(getOllamaApiUrl(normalizedOllamaUrl, 'tags'));

      if (!response.ok) {
        return requestedModel;
      }

      const body = await response.json();
      const models = Array.isArray(body?.models) ? body.models : [];
      const exactMatch = models.find((model) => getModelName(model) === requestedModel);

      if (exactMatch) {
        return getModelName(exactMatch);
      }

      if (!requestedModel.includes(':')) {
        const familyMatch = models.find((model) => modelMatchesFamily(model, requestedModel));

        if (familyMatch) {
          return getModelName(familyMatch);
        }
      }
    } catch (_error) {
      return requestedModel;
    }

    return requestedModel;
  };

  const parseJsonContent = (content) => {
    if (!content || typeof content !== 'string') {
      throw new ApplicationError('Ollama returned an empty JSON response.');
    }

    try {
      return JSON.parse(content);
    } catch (_error) {
      const match = content.match(/\{[\s\S]*\}/u);

      if (!match) {
        throw new ApplicationError('Ollama did not return valid JSON.');
      }

      try {
        return JSON.parse(match[0]);
      } catch {
        throw new ApplicationError('Ollama returned malformed JSON.');
      }
    }
  };

  const callOllamaChat = async ({ ollamaUrl, ollamaModel, messages, format }) => {
    const requestedModel = resolveModel(ollamaModel);
    const normalizedOllamaUrl = normalizeOllamaUrl(ollamaUrl);
    const model = await resolveInstalledModel({ normalizedOllamaUrl, requestedModel });
    const chatUrl = getOllamaApiUrl(normalizedOllamaUrl, 'chat');
    let response;

    try {
      response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          stream: false,
          ...(format ? { format } : {}),
          messages,
        }),
      });
    } catch (_error) {
      throw new ApplicationError(
        `Ollama is unavailable. Check ${normalizedOllamaUrl} and make sure model ${model} is installed.`
      );
    }

    let body;

    try {
      body = await response.json();
    } catch (_error) {
      throw new ApplicationError('Ollama returned a non-JSON response.');
    }

    if (!response.ok) {
      const message = body?.error || `Ollama request failed with status ${response.status}.`;
      throw new ApplicationError(
        `${message} Check ${normalizedOllamaUrl} and make sure model ${model} is installed.`
      );
    }

    return {
      content: body?.message?.content || '',
      totalDurationMs:
        typeof body?.total_duration === 'number'
          ? Math.max(0, Math.round(body.total_duration / 1_000_000))
          : null,
      promptEvalDurationMs:
        typeof body?.prompt_eval_duration === 'number'
          ? Math.max(0, Math.round(body.prompt_eval_duration / 1_000_000))
          : null,
      evalDurationMs:
        typeof body?.eval_duration === 'number'
          ? Math.max(0, Math.round(body.eval_duration / 1_000_000))
          : null,
    };
  };

  const compactString = (value) => (typeof value === 'string' ? value.trim() : '');

  const stringifyInput = (value) => {
    try {
      return JSON.stringify(value, null, 2);
    } catch (_error) {
      return String(value);
    }
  };

  const collectFrameTexts = (node, acc = []) => {
    if (!node || typeof node !== 'object' || acc.length >= 40) {
      return acc;
    }

    const text = compactString(node?.text?.characters);

    if (text) {
      acc.push(text.slice(0, 220));
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        collectFrameTexts(child, acc);

        if (acc.length >= 40) {
          break;
        }
      }
    }

    return acc;
  };

  const summarizeFrameJson = (frameJson) => {
    if (!frameJson || typeof frameJson !== 'object') {
      return {};
    }

    const children = Array.isArray(frameJson.children) ? frameJson.children : [];

    return {
      id: frameJson.id,
      name: frameJson.name,
      type: frameJson.type,
      width: frameJson.width,
      height: frameJson.height,
      topLevelChildren: children.slice(0, 24).map((child) => ({
        id: child?.id,
        name: child?.name,
        type: child?.type,
        x: child?.x,
        y: child?.y,
        width: child?.width,
        height: child?.height,
      })),
      textContent: collectFrameTexts(frameJson),
    };
  };

  const normalizeQuestion = (value) =>
    compactString(value)
      .toLowerCase()
      .replace(/[ё]/gu, 'е')
      .replace(/[^\p{L}\p{N}\s?]+/gu, ' ')
      .replace(/\s+/gu, ' ')
      .trim()
      .slice(0, 180);

  const getQuestionFingerprint = (payload) =>
    normalizeQuestion(payload?.fingerprint || payload?.question || payload?.displayText || '').replace(/\?+$/u, '').trim();

  const normalizeQuestionRecord = (record) => ({
    fingerprint: compactString(record?.fingerprint),
    displayText: compactString(record?.displayText),
    count: Number(record?.count) || 0,
    lastAskedAt: record?.lastAskedAt || record?.updatedAt || new Date().toISOString(),
  });

  const getOptionalUser = async (ctx) => {
    if (!strapi) {
      return null;
    }

    try {
      const tokenPayload = await strapi.plugin('users-permissions').service('jwt').getToken(ctx);

      if (!tokenPayload?.id) {
        return null;
      }

      const user = await strapi.plugin('users-permissions').service('user').fetchAuthenticatedUser(tokenPayload.id);

      if (!user || user.blocked) {
        return null;
      }

      return user;
    } catch (_error) {
      return null;
    }
  };

  const upsertQuestionCounter = async ({ uid, where, data }) => {
    const existing = await strapi.db.query(uid).findOne({ where });

    if (existing) {
      return strapi.db.query(uid).update({
        where: { id: existing.id },
        data: {
          ...data,
          count: (Number(existing.count) || 0) + 1,
        },
      });
    }

    return strapi.db.query(uid).create({
      data: {
        ...data,
        count: 1,
      },
    });
  };

  const loadQuestionSuggestions = async ({ uid, user }) => {
    const where = {
      count: { $gte: 3 },
      ...(user ? { user: { id: user.id } } : {}),
    };

    const records = await strapi.db.query(uid).findMany({
      where,
      limit: 3,
      orderBy: [
        { count: 'desc' },
        { lastAskedAt: 'desc' },
      ],
    });

    return records.map(normalizeQuestionRecord);
  };

  const buildPersonaPrompt = ({ prompt, language }) => `
Ты помогаешь создать AI-личность для анализа Figma-дизайна.
Язык ответа: ${language === 'en' ? 'English' : 'Русский'}.

Задача пользователя:
${compactString(prompt) || 'Создай полезную личность для дизайн-анализа.'}

Верни только JSON без markdown:
{
  "name": "короткое название личности",
  "audience": "какую аудиторию/роль имитирует",
  "behavior": "как эта личность смотрит на интерфейс",
  "priorities": "что особенно важно при анализе",
  "notes": "дополнительные инструкции для AI"
}
`;

  const buildContextPrompt = ({ prompt, language }) => `
Ты помогаешь создать контекст проекта для анализа Figma-дизайна.
Язык ответа: ${language === 'en' ? 'English' : 'Русский'}.

Задача пользователя:
${compactString(prompt) || 'Создай полезный контекст проекта для дизайн-анализа.'}

Верни только JSON без markdown:
{
  "name": "короткое название проекта/контекста",
  "project": "что это за продукт или проект",
  "audience": "целевая аудитория проекта",
  "mission": "главная цель/миссия проекта",
  "constraints": "ограничения, тон, бизнес-условия",
  "notes": "дополнительные инструкции для AI"
}
`;

  const normalizeDiscussionHistory = (history) => {
    if (!Array.isArray(history)) {
      return [];
    }

    return history
      .map((item) => ({
        role: item?.role === 'assistant' ? 'assistant' : 'user',
        content: compactString(item?.content),
      }))
      .filter((item) => item.content)
      .slice(-10);
  };

  const buildAnalysisPrompt = ({ frameName, frameJson, persona, context, language }) => `
Ты анализируешь выбранный Figma frame. Используй оба источника: изображение и JSON.
Изображение показывает визуальный результат, JSON дает точные размеры, тексты, структуру, цвета и layout.
Язык ответа: ${language === 'en' ? 'English' : 'Русский'}.

Выбранный frame: ${compactString(frameName) || 'Без названия'}

Личность анализа:
${stringifyInput(persona || {})}

Контекст проекта:
${stringifyInput(context || {})}

Figma frame JSON:
\`\`\`json
${stringifyInput(frameJson || {})}
\`\`\`

Верни markdown-анализ строго с такими разделами:

## Оценка по критериям
Оцени каждый критерий по шкале 0-10. Для каждого критерия дай: "N/10 — короткий вывод. Что улучшить: конкретное действие."

1. Коммуникация — насколько frame ясно доносит идею, иерархию, смысл, состояние и следующий шаг.
2. Продуктовое мышление — насколько решение поддерживает цель продукта, пользователя, сценарий, ограничения и бизнес-смысл.
3. UI — визуальная система, композиция, типографика, цвет, контраст, плотность, аккуратность.
4. UX — понятность сценария, интерактивность, состояния, ошибки, навигация, когнитивная нагрузка.
5. Автономность — насколько frame самодостаточен без объяснений: есть нужные состояния, edge cases и самостоятельность решения.
6. Инструменты — Figma-структура, auto layout, components, variants, naming, styles/tokens, переиспользуемость. AI/workflow учитывай только если это явно видно из контекста; не выдумывай использование AI.

## Краткий вывод
2-4 предложения.

## Что работает хорошо
Список конкретных сильных решений.

## Что мешает
Список конкретных проблем.

## Что поправить
Список приоритетных правок с high / medium / low.
`;

  const buildDiscussionSystemPrompt = ({ language }) => `
Ты продуктовый дизайн-аудитор внутри Figma plugin.
Язык ответа: ${language === 'en' ? 'English' : 'Русский'}.

Критично:
- Backend уже передал тебе исходный анализ, Figma frame JSON, выбранную личность и контекст проекта.
- Никогда не проси пользователя прислать JSON, JSON-файл, контекст или persona, если они уже есть в сообщении.
- Если конкретного поля нет в переданном JSON, так и скажи: "в переданном JSON этого не видно", затем дай лучший вывод по доступным данным.
- Новый скриншот в follow-up не передается; если нужна новая визуальная проверка, предложи заново запустить анализ frame.
`;

  const buildDiscussionPrompt = ({ question, history, initialAnalysis, frameName, frameJson, persona, context, language }) => `
Ты продолжаешь обсуждение уже выполненного анализа Figma frame.
Язык ответа: ${language === 'en' ? 'English' : 'Русский'}.

Важно:
- Отвечай по исходному анализу, JSON frame, личности и контексту.
- JSON frame уже передан ниже в этом запросе. Не проси пользователя загрузить или прислать JSON-файл.
- Новый скриншот сейчас не передается. Не притворяйся, что видишь новую картинку.
- Если вопрос требует свежей визуальной проверки, скажи, что лучше заново запустить анализ frame.
- Отвечай markdown-форматом, конкретно и прикладно.
- Для рабочих вопросов возвращай ответ в структуре: "## Гипотеза", "## Доказательство", "## Решение", "## Следующий шаг". Если пользователь просит prompt/code/roadmap, адаптируй эти секции под задачу, но оставайся конкретным.

Frame: ${compactString(frameName) || 'Без названия'}

Текущая личность анализа: ${compactString(persona?.name) || 'не указана'}.
Текущий контекст проекта: ${compactString(context?.name) || 'не указан'}.
Если пользователь спрашивает, какая persona/context сейчас используются, отвечай этими сохраненными значениями и кратко перескажи их поля.

Личность анализа:
${stringifyInput(persona || {})}

Контекст проекта:
${stringifyInput(context || {})}

Исходный анализ:
${compactString(initialAnalysis)}

Figma frame JSON:
\`\`\`json
${stringifyInput(frameJson || {})}
\`\`\`

Краткая сводка JSON frame:
\`\`\`json
${stringifyInput(summarizeFrameJson(frameJson))}
\`\`\`

История обсуждения:
${stringifyInput(normalizeDiscussionHistory(history))}

Вопрос пользователя:
${compactString(question)}

Контракт ответа:
- Отвечай так, будто контекст текущего frame активен, потому что он активен.
- Не говори "пришлите JSON", "загрузите файл", "мне нужен JSON" или похожие фразы.
- Если информации недостаточно, укажи, какой конкретно детали нет в уже переданном JSON, и предложи следующий практический шаг.
`;

  const normalizeGeneratedPersona = (profile) => ({
    name: compactString(profile?.name) || 'Новая личность',
    audience: compactString(profile?.audience),
    behavior: compactString(profile?.behavior),
    priorities: compactString(profile?.priorities),
    notes: compactString(profile?.notes),
  });

  const normalizeGeneratedContext = (profile) => ({
    name: compactString(profile?.name) || 'Новый контекст',
    project: compactString(profile?.project),
    audience: compactString(profile?.audience),
    mission: compactString(profile?.mission),
    constraints: compactString(profile?.constraints),
    notes: compactString(profile?.notes),
  });

  return {
    async generatePersona(payload) {
      const result = await callOllamaChat({
        ollamaUrl: payload.ollamaUrl,
        ollamaModel: payload.ollamaModel,
        format: 'json',
        messages: [
          {
            role: 'user',
            content: buildPersonaPrompt(payload),
          },
        ],
      });

      return {
        profile: normalizeGeneratedPersona(parseJsonContent(result.content)),
        durationMs: result.totalDurationMs,
      };
    },

    async generateContext(payload) {
      const result = await callOllamaChat({
        ollamaUrl: payload.ollamaUrl,
        ollamaModel: payload.ollamaModel,
        format: 'json',
        messages: [
          {
            role: 'user',
            content: buildContextPrompt(payload),
          },
        ],
      });

      return {
        profile: normalizeGeneratedContext(parseJsonContent(result.content)),
        durationMs: result.totalDurationMs,
      };
    },

    async analyzeFrame(payload) {
      if (!payload.frameJson || !payload.frameImageBase64) {
        throw new ValidationError('frameJson and frameImageBase64 are required.');
      }

      const result = await callOllamaChat({
        ollamaUrl: payload.ollamaUrl,
        ollamaModel: payload.ollamaModel,
        messages: [
          {
            role: 'user',
            content: buildAnalysisPrompt(payload),
            images: [payload.frameImageBase64],
          },
        ],
      });

      return {
        message: result.content,
        durationMs: result.totalDurationMs,
        promptEvalDurationMs: result.promptEvalDurationMs,
        evalDurationMs: result.evalDurationMs,
      };
    },

    async discussAnalysis(payload) {
      if (!compactString(payload.question)) {
        throw new ValidationError('question is required.');
      }

      if (!compactString(payload.initialAnalysis) || !payload.frameJson) {
        throw new ValidationError('initialAnalysis and frameJson are required.');
      }

      const result = await callOllamaChat({
        ollamaUrl: payload.ollamaUrl,
        ollamaModel: payload.ollamaModel,
        messages: [
          {
            role: 'system',
            content: buildDiscussionSystemPrompt(payload),
          },
          {
            role: 'user',
            content: buildDiscussionPrompt(payload),
          },
        ],
      });

      return {
        message: result.content,
        durationMs: result.totalDurationMs,
      };
    },

    async trackQuestion(ctx) {
      const payload = ctx.request.body || {};
      const fingerprint = getQuestionFingerprint(payload);
      const displayText = compactString(payload.displayText || payload.question).slice(0, 180);

      if (!strapi || !fingerprint || !displayText) {
        return {
          personalSuggestions: [],
          globalSuggestions: [],
        };
      }

      const now = new Date().toISOString();
      const user = await getOptionalUser(ctx);

      await upsertQuestionCounter({
        uid: GLOBAL_QUESTION_UID,
        where: { fingerprint },
        data: {
          fingerprint,
          displayText,
          lastAskedAt: now,
        },
      });

      if (user) {
        await upsertQuestionCounter({
          uid: PERSONAL_QUESTION_UID,
          where: {
            fingerprint,
            user: { id: user.id },
          },
          data: {
            fingerprint,
            displayText,
            lastAskedAt: now,
            user: user.id,
          },
        });
      }

      return {
        personalSuggestions: user
          ? await loadQuestionSuggestions({ uid: PERSONAL_QUESTION_UID, user })
          : [],
        globalSuggestions: await loadQuestionSuggestions({ uid: GLOBAL_QUESTION_UID }),
      };
    },
  };
};
