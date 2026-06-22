export const PROVIDERS_AND_MODELS = {
  groq: {
    name: 'GroqCloud',
    models: [
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 (8B)' },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 (70B)' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 (9B)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral (8x7B)' }
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B' },
      { id: 'qwen/qwen-2.5-7b-instruct:free', name: 'Qwen 2.5 7B' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1' },
      { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Gemini 2.0 Flash Lite' }
    ]
  },
  bedrock: {
    name: 'AWS Bedrock',
    models: [
      { id: 'anthropic.claude-opus-4-5-20251101-v1:0', name: 'Claude 4.5 Opus' },
      { id: 'anthropic.claude-sonnet-4-5-20250929-v1:0', name: 'Claude 4.5 Sonnet' }
    ]
  }
};
