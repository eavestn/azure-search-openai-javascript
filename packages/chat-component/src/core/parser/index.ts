import { newListWithEntryAtIndex } from '../../utils/index.js';

// parse and format citations
export function parseCitations(inputText: string): Citation[] {
  const findCitations = /\[(.*?)]/g;
  const citation: NonNullable<unknown> = {};
  let referenceCounter = 1;

  // extract citation (filename) from the text and map it to a reference number
  inputText.replaceAll(findCitations, (_, capture) => {
    const citationText = capture.trim();
    if (!citation[citationText]) {
      citation[citationText] = referenceCounter++;
    }
    return '';
  });

  return Object.keys(citation).map((text, index) => ({
    ref: index + 1,
    text,
  }));
}

// update the text block entry
export function updateTextEntry({
  chunkValue,
  textBlockIndex,
  chatEntry,
}: {
  chunkValue: string;
  textBlockIndex: number;
  chatEntry: ChatThreadEntry;
}): ChatThreadEntry {
  const { text: lastChatMessageTextEntry } = chatEntry;
  const block = lastChatMessageTextEntry[textBlockIndex] ?? {
    value: '',
  };

  const value = (block.value || '') + chunkValue;

  return {
    ...chatEntry,
    text: newListWithEntryAtIndex(lastChatMessageTextEntry, textBlockIndex, {
      ...block,
      value,
    }),
  };
}
