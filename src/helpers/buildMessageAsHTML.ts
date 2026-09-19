import { parse } from 'node-html-parser';
import { IMessageContextSendOptions } from 'vk-io';

type FormatItem = {
  type: 'bold' | 'italic' | 'underline' | 'url';
  offset: number;
  length: number;
  url?: string;
};

export default function buildMessageAsHTML(input: string, version: number = 1): IMessageContextSendOptions {
  const root = parse(input);
  let message = '';
  const items: FormatItem[] = [];

  function walk(node: any) {
    if (node.nodeType === 3) {
      message += node.rawText;
    } else if (node.nodeType === 1) {
      const start = message.length;
      node.childNodes.forEach(walk);
      const end = message.length;

      const tag = node.tagName.toLowerCase();
      if (tag === 'b' || tag === 'strong') {
        items.push({ type: 'bold', offset: start, length: end - start });
      } else if (tag === 'i' || tag === 'em') {
        items.push({ type: 'italic', offset: start, length: end - start });
      } else if (tag === 'u') {
        items.push({ type: 'underline', offset: start, length: end - start });
      } else if (tag === 'a') {
        items.push({ type: 'url', offset: start, length: end - start, url: node.getAttribute('href') });
      }
    }
  }

  root.childNodes.forEach(walk);

  return {
    message,
    format_data: JSON.stringify({ version, items })
  };
}