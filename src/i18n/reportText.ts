import messages from './reportCopy.json';

export type MessageKey = keyof typeof messages;

export function reportText(key: MessageKey, values: Record<string, string | number> = {}): string {
  return messages[key].replace(/\{(\w+)\}/g, (token, name) =>
    values[name] === undefined ? token : String(values[name]));
}
