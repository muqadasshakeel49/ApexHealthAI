import { AIService } from './types';
import { MistralAIService } from './MistralAIService';
import config from '../../config';

let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new MistralAIService(config.mistral.apiKey, config.mistral.model);
  }
  return aiServiceInstance;
}

export * from './types';
export * from './MistralAIService';
export * from './FallbackAIService';
export * from './prompt';
export default getAIService;
