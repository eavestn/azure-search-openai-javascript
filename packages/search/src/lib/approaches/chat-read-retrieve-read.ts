import { type SearchClient } from '@azure/search-documents';
import { type OpenAiService } from '../../plugins/openai.js';
import {
  type ChatApproach,
  type ApproachResponse,
  type ChatApproachContext,
  type ApproachResponseChunk,
} from './approach.js';
import { ApproachBase } from './approach-base.js';
import { type Message } from '../message.js';
import { MessageBuilder } from '../message-builder.js';
import { getTokenLimit } from '../tokens.js';

const QUERY_PROMPT_TEMPLATE = `
Contained is a history of the conversation so far, including a new question asked by the user that needs to be answered.
If the question is not in English, translate the question to English before generating the search query.
`;

/**
 * Simple retrieve-then-read implementation, using the AI Search and OpenAI APIs directly.
 * It first retrieves top documents from search, then constructs a prompt with them, and then uses
 * OpenAI to generate an completion (answer) with that prompt.
 */
export class ChatReadRetrieveRead extends ApproachBase implements ChatApproach {
  chatGptTokenLimit: number;

  constructor(
    search: SearchClient<any>,
    openai: OpenAiService,
    chatGptModel: string,
    embeddingModel: string,
    sourcePageField: string,
    contentField: string,
  ) {
    super(search, openai, chatGptModel, embeddingModel, sourcePageField, contentField);
    this.chatGptTokenLimit = getTokenLimit(chatGptModel);
  }

  async run(messages: Message[], context?: ChatApproachContext): Promise<ApproachResponse> {
    const input = messages[messages.length - 1].content;

    const history = this.createChatHistoryWithNewInput(
      QUERY_PROMPT_TEMPLATE,
      this.chatGptModel,
      messages,
      input,
      this.chatGptTokenLimit - input.length,
    );

    const openAiChat = await this.openai.getChat();

    const completion = await openAiChat.completions.create({
      model: this.chatGptModel,
      messages: history,
      temperature: Number(context?.temperature ?? 0.7),
      max_tokens: 32,
      n: 1,
    });

    const response = completion.choices[0];
    const content = response.message.content ?? '';

    return {
      choices: [
        {
          index: 0,
          message: {
            content,
            role: 'assistant',
          },
        },
      ],
      object: 'chat.completion',
    };
  }

  async *runWithStreaming(
    messages: Message[],
    context?: ChatApproachContext,
  ): AsyncGenerator<ApproachResponseChunk, void> {
    const input = messages[messages.length - 1].content;

    const history = this.createChatHistoryWithNewInput(
      QUERY_PROMPT_TEMPLATE,
      this.chatGptModel,
      messages,
      input,
      this.chatGptTokenLimit - input.length,
    );

    const openAiChat = await this.openai.getChat();

    const chatCompletion = await openAiChat.completions.create({
      model: this.chatGptModel,
      messages: history,
      temperature: Number(context?.temperature ?? 0.7),
      max_tokens: 32,
      n: 1,
      stream: true,
    });

    for await (const chunk of chatCompletion) {
      const responseChunk = {
        choices: [
          {
            index: 0,
            delta: {
              content: chunk.choices[0]?.delta.content ?? '',
              role: 'assistant' as const,
            },
            finish_reason: chunk.choices[0]?.finish_reason,
          },
        ],
        object: 'chat.completion.chunk' as const,
      };
      yield responseChunk;
    }
  }

  private createChatHistoryWithNewInput(
    systemPrompt: string,
    model: string,
    history: Message[],
    input: string,
    maxTokens = 4096,
  ): Message[] {
    const messageBuilder = new MessageBuilder(systemPrompt, model);

    messageBuilder.appendMessage('user', input);

    for (const record of history.slice(0, -1).reverse()) {
      if (messageBuilder.tokens > maxTokens) {
        break;
      }

      if (record.role === 'assistant' || record.role === 'user') {
        messageBuilder.appendMessage(record.role, record.content);
      }
    }

    return messageBuilder.messages;
  }
}
