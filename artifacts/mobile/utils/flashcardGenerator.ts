import Constants from 'expo-constants';

export interface Flashcard {
  pergunta: string;
  resposta: string;
}

export interface GenerateFlashcardsOptions {
  onLoading?: (loading: boolean) => void;
}

/**
 * Função principal para gerar flashcards a partir de texto extraído por OCR
 */
export async function generateFlashcards(
  text: string,
  options: GenerateFlashcardsOptions = {}
): Promise<Flashcard[]> {
  const { onLoading } = options;

  try {
    onLoading?.(true);

    // 1. Limpar o texto
    const cleanedText = cleanText(text);

    // 2. Verificar se já contém perguntas e respostas
    if (detectQA(cleanedText)) {
      console.log('Texto já contém perguntas e respostas, organizando...');
      return parseQA(cleanedText);
    }

    // 3. Caso contrário, chamar IA
    console.log('Texto não estruturado, chamando IA...');
    return await callAI(cleanedText);

  } catch (error) {
    console.error('Erro ao gerar flashcards:', error);
    alert('Erro ao gerar flashcards: ' + (error instanceof Error ? error.message : String(error)));
    return [];
  } finally {
    onLoading?.(false);
  }
}

/**
 * Limpa o texto removendo quebras de linha excessivas e espaços desnecessários
 */
function cleanText(text: string): string {
  return text
    .replace(/\n\s*\n/g, '\n') // Remove linhas vazias consecutivas
    .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
    .trim();
}

/**
 * Detecta se o texto já contém perguntas e respostas estruturadas
 */
function detectQA(text: string): boolean {
  const patterns = [
    /pergunta:/i,
    /resposta:/i,
    /q:/i,
    /a:/i,
    /\?/ // Pelo menos uma interrogação
  ];

  return patterns.some(pattern => pattern.test(text));
}

/**
 * Organiza texto que já contém perguntas e respostas
 */
function parseQA(text: string): Flashcard[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const flashcards: Flashcard[] = [];
  let currentQuestion = '';
  let currentAnswer = '';

  for (const line of lines) {
    if (line.toLowerCase().startsWith('pergunta:') || line.toLowerCase().startsWith('q:')) {
      // Salvar pergunta anterior se existir
      if (currentQuestion && currentAnswer) {
        flashcards.push({ pergunta: currentQuestion, resposta: currentAnswer });
      }
      currentQuestion = line.replace(/^(pergunta:|q:)\s*/i, '');
      currentAnswer = '';
    } else if (line.toLowerCase().startsWith('resposta:') || line.toLowerCase().startsWith('a:')) {
      currentAnswer = line.replace(/^(resposta:|a:)\s*/i, '');
    } else if (currentQuestion && !currentAnswer) {
      // Continuar pergunta se não houver resposta ainda
      currentQuestion += ' ' + line;
    } else if (currentAnswer) {
      // Continuar resposta
      currentAnswer += ' ' + line;
    }
  }

  // Adicionar último par se existir
  if (currentQuestion && currentAnswer) {
    flashcards.push({ pergunta: currentQuestion, resposta: currentAnswer });
  }

  return flashcards;
}

/**
 * Chama a API do OpenRouter para gerar flashcards
 */
async function callAI(text: string): Promise<Flashcard[]> {
  const apiKey =
    Constants.expoConfig?.extra?.OPENROUTER_KEY ||
    process.env.EXPO_PUBLIC_OPENROUTER_KEY ||
    process.env.VITE_OPENROUTER_KEY ||
    process.env.OPENROUTER_KEY;

  console.log('🔑 Debug API Key:', {
    fromConstants: !!Constants.expoConfig?.extra?.OPENROUTER_KEY,
    fromExpoPublic: !!process.env.EXPO_PUBLIC_OPENROUTER_KEY,
    fromVite: !!process.env.VITE_OPENROUTER_KEY,
    fromOpenRouter: !!process.env.OPENROUTER_KEY,
    apiKeyLength: apiKey?.length || 0
  });

  if (!apiKey) {
    throw new Error('OPENROUTER_KEY, EXPO_PUBLIC_OPENROUTER_KEY ou VITE_OPENROUTER_KEY não configurada');
  }

  // Limitar tamanho do texto
  const limitedText = text.length > 2500 ? text.substring(0, 2500) + '...' : text;

  const prompt = `Analise o seguinte texto e gere flashcards de estudo. Cada flashcard deve ter uma pergunta e uma resposta.

Texto: "${limitedText}"

Instruções:
- Gere 3-8 flashcards relevantes
- As perguntas devem ser claras e objetivas
- As respostas devem ser completas mas concisas
- Foque nos conceitos principais do texto
- Retorne APENAS um JSON válido no formato:
[{"pergunta": "Pergunta aqui", "resposta": "Resposta aqui"}]

IMPORTANTE: Responda apenas com o JSON, sem texto adicional.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro da API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta da API vazia');
    }

    console.log('Resposta da IA:', content);

    // Tentar parse do JSON
    let flashcards: Flashcard[];
    try {
      flashcards = JSON.parse(content);
    } catch (parseError) {
      console.warn('JSON inválido, tentando corrigir...');
      // Tentar encontrar JSON dentro do texto
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          flashcards = JSON.parse(jsonMatch[0]);
        } catch {
          console.error('Não foi possível parsear JSON');
          return [];
        }
      } else {
        return [];
      }
    }

    // Validar estrutura
    if (!Array.isArray(flashcards)) {
      console.warn('Resposta não é um array');
      return [];
    }

    return flashcards.filter(card =>
      card &&
      typeof card.pergunta === 'string' &&
      typeof card.resposta === 'string' &&
      card.pergunta.trim() &&
      card.resposta.trim()
    );

  } catch (error) {
    console.error('Erro na chamada da API:', error);
    throw error;
  }
}