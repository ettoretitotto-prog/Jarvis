export interface GeminiCoachResponse {
  text: string;
}

export interface CoachEntry {
  user: string;
  workouts: Array<{
    name: string;
    date: string;
    distanceKm: number;
    elevationM: number;
  }>;
}

const STORAGE_KEY = 'jarvis.geminiApiKey';
const FALLBACK_MESSAGE = 'Coach offline: usa più volume e cura la costanza.';
const DEFAULT_MODEL_CANDIDATES = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

export function getStoredGeminiApiKey(): string | null {
  if (typeof window === 'undefined') {
    return import.meta.env.VITE_GEMINI_API_KEY ?? null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return stored;
  }

  return import.meta.env.VITE_GEMINI_API_KEY ?? null;
}

export function setStoredGeminiApiKey(apiKey: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const value = apiKey.trim();
  if (value) {
    window.localStorage.setItem(STORAGE_KEY, value);
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export async function generateCoachText(payload: string, apiKeyOverride?: string | null): Promise<GeminiCoachResponse> {
  const apiKey = apiKeyOverride ?? getStoredGeminiApiKey();

  if (!apiKey) {
    return {
      text: 'Inserisci la chiave Gemini per attivare il consiglio.',
    };
  }

  const systemPrompt = `Sei un coach di ciclismo per la gara Eroica. Ottobre è vicino. Analizza questi dati settimanali: ${payload}. Scrivi una sola frase d'impatto, diretta e senza preamboli. Se i km sono bassi, sii ironico ma pungente. Se manca il fondo, suggerisci un lungo. Se mancano intensità, suggerisci sprint.`;

  const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const modelCandidates = DEFAULT_MODEL_CANDIDATES.slice();

  if (modelsResponse.ok) {
    const modelsData = await modelsResponse.json();
    const availableModels = Array.isArray(modelsData?.models)
      ? modelsData.models
          .filter((model: { name?: string; supportedGenerationMethods?: string[] }) => {
            const name = model?.name?.replace(/^models\//, '') ?? '';
            return name && Array.isArray(model.supportedGenerationMethods) && model.supportedGenerationMethods.includes('generateContent');
          })
          .map((model: { name?: string }) => model.name?.replace(/^models\//, '') ?? '')
          .filter(Boolean)
      : [];

    for (const model of availableModels) {
      if (!modelCandidates.includes(model)) {
        modelCandidates.unshift(model);
      }
    }
  }

  for (const model of modelCandidates) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
        }),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      return { text: text.trim() || FALLBACK_MESSAGE };
    } catch {
      continue;
    }
  }

  return { text: FALLBACK_MESSAGE };
}

function buildFallbackAdvice(entry: CoachEntry) {
  const totalKm = entry.workouts.reduce((sum, workout) => sum + workout.distanceKm, 0);
  const totalSessions = entry.workouts.length;
  const averageKm = totalSessions > 0 ? totalKm / totalSessions : 0;
  const latest = entry.workouts[0];
  const latestDay = latest ? new Date(latest.date).toLocaleDateString('it-IT') : 'nessuna data';

  if (totalSessions === 0) {
    return `${entry.user}: niente uscite, oggi si pedala o si riposa ma si pianifica.`;
  }

  if (totalKm < 40) {
    return `${entry.user}: volume basso (${totalKm.toFixed(1)} km in ${totalSessions} uscite). Serve un lungo da costruire bene.`;
  }

  if (averageKm < 15) {
    return `${entry.user}: buone gambe ma fondo corto. L’ultima uscita è del ${latestDay}, alza il chilometraggio.`;
  }

  return `${entry.user}: lavoro solido. Continua così e inserisci un richiamo di intensità dopo ${totalSessions} uscite.`;
}

export async function generateCoachAdviceForUsers(entries: CoachEntry[], apiKeyOverride?: string | null): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const apiKey = apiKeyOverride ?? getStoredGeminiApiKey();

  if (!apiKey) {
    return Object.fromEntries(entries.map((entry) => [entry.user, buildFallbackAdvice(entry)]));
  }

  for (const entry of entries) {
    const payload = entry.workouts.length > 0
      ? entry.workouts.map((item) => `${item.name} • ${new Date(item.date).toLocaleDateString('it-IT')} • ${item.distanceKm.toFixed(1)} km`).join(' | ')
      : 'Nessun allenamento ancora inserito';

    const systemPrompt = `Sei un coach di ciclismo per Eroica. Scrivi un consiglio breve, chiaro e motivato per ${entry.user}. Usa solo i dati che ti passo: ${payload}. Massimo 2 righe, in italiano, con tono diretto.`;

    try {
      const coachText = await generateCoachText(systemPrompt, apiKey);
      result[entry.user] = coachText.text.trim() || buildFallbackAdvice(entry);
    } catch {
      result[entry.user] = buildFallbackAdvice(entry);
    }
  }

  return result;
}
