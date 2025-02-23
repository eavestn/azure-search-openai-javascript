import { type ReactiveController, type ReactiveControllerHost } from 'lit';
import { getAPIResponse } from '../core/http/index.js';
import { type ChatResponseError, getTimestamp } from '../utils/index.js';
import { globalConfig } from '../config/global-config.js';

export class ChatController implements ReactiveController {
  host: ReactiveControllerHost;
  private _generatingAnswer: boolean = false;
  private _isAwaitingResponse: boolean = false;
  private _isProcessingResponse: boolean = false;
  private _processingMessage: ChatThreadEntry | undefined = undefined;
  private _abortController: AbortController = new AbortController();

  get isAwaitingResponse() {
    return this._isAwaitingResponse;
  }

  get isProcessingResponse() {
    return this._isProcessingResponse;
  }

  get processingMessage() {
    return this._processingMessage;
  }

  get generatingAnswer() {
    return this._generatingAnswer;
  }

  set generatingAnswer(value: boolean) {
    this._generatingAnswer = value;
    this.host.requestUpdate();
  }

  set processingMessage(value: ChatThreadEntry | undefined) {
    this._processingMessage = value
      ? {
          ...value,
        }
      : undefined;
    this.host.requestUpdate();
  }

  set isAwaitingResponse(value: boolean) {
    this._isAwaitingResponse = value;
    this.host.requestUpdate();
  }

  set isProcessingResponse(value: boolean) {
    this._isProcessingResponse = value;
    this.host.requestUpdate();
  }

  constructor(host: ReactiveControllerHost) {
    (this.host = host).addController(this);
  }

  hostConnected() {
    // no-op
  }

  hostDisconnected() {
    // no-op
  }

  private clear() {
    this._isAwaitingResponse = false;
    this._isProcessingResponse = false;
    this._generatingAnswer = false;
    this.host.requestUpdate(); // do update once
  }

  reset() {
    this._processingMessage = undefined;
    this.clear();
  }

  async processResponse(response: string | BotResponse, isUserMessage: boolean = false) {
    const timestamp = getTimestamp();

    const updateChatWithMessage = async (message: string | BotResponse) => {
      this.processingMessage = {
        id: crypto.randomUUID(),
        text: [
          {
            value: message as string,
          },
        ],
        timestamp: timestamp,
        isUserMessage,
      };
    };

    if (isUserMessage || typeof response === 'string') {
      await updateChatWithMessage(response);
    } else {
      const generatedResponse = (response as BotResponse).choices[0].message;
      const messageToUpdate = generatedResponse.content;

      await updateChatWithMessage(messageToUpdate);
    }
  }

  async generateAnswer(requestOptions: ChatRequestOptions, httpOptions: ChatHttpOptions) {
    const { question } = requestOptions;

    if (question) {
      try {
        this.generatingAnswer = true;

        if (requestOptions.type === 'chat') {
          await this.processResponse(question, true);
        }

        this.isAwaitingResponse = true;
        this.processingMessage = undefined;

        const response = (await getAPIResponse(requestOptions, httpOptions)) as BotResponse;

        this.isAwaitingResponse = false;

        await this.processResponse(response, false);
      } catch (error_: any) {
        const error = error_ as ChatResponseError;

        const chatError = {
          message: error?.code === 400 ? globalConfig.INVALID_REQUEST_ERROR : globalConfig.API_ERROR_MESSAGE,
        };

        console.error('Error in generating the answer:', error.message);
        console.error(error);

        if (!this.processingMessage) {
          // add a empty message to the chat thread to display the error
          await this.processResponse('', false);
        }

        if (this.processingMessage) {
          this.processingMessage = {
            ...this.processingMessage,
            error: chatError,
          };
        }
      } finally {
        this.clear();
      }
    }
  }

  cancelRequest() {
    this._abortController.abort();
  }
}
