// Clean up responses with << and >>
export function cleanUpFollowUp(followUpList: string[]): string[] {
  if (followUpList && followUpList.length > 0 && followUpList[0].startsWith('<<')) {
    followUpList = followUpList.map((followUp) => followUp.replace('<<', '').replace('>>', ''));
  }
  return followUpList;
}

// Get the current timestamp to display with the chat message
export function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });
}

export function chatEntryToString(entry: ChatThreadEntry) {
  const message = entry.text
    .map((textEntry) => textEntry.value + '\n\n')
    .join('\n\n')
    .replaceAll(/<sup[^>]*>(.*?)<\/sup>/g, ''); // remove the <sup> tags from the message

  return message;
}

// Creates a new chat message error
export class ChatResponseError extends Error {
  code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.code = code;
  }
}

export function newListWithEntryAtIndex<T>(list: T[], index: number, entry: T) {
  return [...list.slice(0, index), entry, ...list.slice(index + 1)];
}
