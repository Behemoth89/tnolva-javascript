import { AnthropicClient } from './anthropic';
import { OpenAICompletionsClient } from './openaiCompletions';
import { OpenAIResponsesClient } from './openaiResponses';
import {
  LlmError,
  httpStatusToLlmError,
  isLlmError,
  toLlmError,
} from './errors';
import type { LlmClient, LLMProviderType } from './types';

export function createLlmClient(providerType: LLMProviderType): LlmClient {
  switch (providerType) {
    case 'openai_completions':
      return new OpenAICompletionsClient();
    case 'openai_responses':
      return new OpenAIResponsesClient();
    case 'anthropic':
      return new AnthropicClient();
    default: {
      const exhaustive: never = providerType;
      throw new Error(`Unknown LLM provider type: ${String(exhaustive)}`);
    }
  }
}

export { OpenAICompletionsClient, OpenAIResponsesClient, AnthropicClient, LlmError, httpStatusToLlmError, isLlmError, toLlmError };
export * from './types';
