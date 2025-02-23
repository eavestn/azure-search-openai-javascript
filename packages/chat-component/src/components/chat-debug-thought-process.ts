/* eslint-disable unicorn/template-indent */
import { injectable } from 'inversify';
import {
  container,
  lazyMultiInject,
  type ChatSectionController,
  type CitationController,
  ControllerType,
  ComposableReactiveControllerBase,
} from './composable.js';
import { html } from 'lit';
import { globalConfig } from '../config/global-config.js';
import iconClose from '../../public/svg/close-icon.svg?raw';

@injectable()
export class ChatDebugThoughtProcessController
  extends ComposableReactiveControllerBase
  implements ChatSectionController
{
  constructor() {
    super();
    this.close = this.close.bind(this);
  }

  @lazyMultiInject(ControllerType.Citation)
  citationControllers: CitationController[] | undefined;

  override hostConnected() {
    if (this.citationControllers) {
      for (const controller of this.citationControllers) {
        controller.attach(this.host, this.context);
      }
    }
  }

  handleCitationClick(event: CustomEvent): void {
    event?.preventDefault();
    this.context.selectedCitation = event?.detail?.citation;

    this.context.setState('showCitations', true);
  }

  get isEnabled() {
    return this.isShowingThoughtProcess;
  }

  public close() {
    this.isShowingThoughtProcess = false;
    this.context.setState('showCitations', false);
    this.context.selectedChatEntry = undefined;
  }

  get isShowingThoughtProcess() {
    return this.context.getState('showThoughtProcess') || this.context.getState('showCitations');
  }

  set isShowingThoughtProcess(value: boolean) {
    this.context.setState('showThoughtProcess', value);
  }

  get selectedAsideTab() {
    if (this.context.getState('showCitations')) {
      return 'tab-citations';
    }

    return 'tab-thought-process';
  }

  render() {
    return html`
      <aside class="aside" data-testid="aside-thought-process">
        <div class="aside__header">
          <chat-action-button
            .label="${globalConfig.HIDE_THOUGH_PROCESS_BUTTON_LABEL_TEXT}"
            actionId="chat-hide-thought-process"
            @click="${this.close}"
            .svgIcon="${iconClose}"
          >
          </chat-action-button>
        </div>
      </aside>
    `;
  }
}

container.bind<ChatSectionController>(ControllerType.ChatSection).to(ChatDebugThoughtProcessController);
