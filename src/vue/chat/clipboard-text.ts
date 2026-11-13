/**
 * The text a paste carries. A link copied from some apps (Messages on macOS) is on the clipboard as a URL
 * only, with no plain text: fall back to the first link of the URL flavors a browser can expose.
 */
export function clipboardText(clipboard: Pick<DataTransfer, 'getData'> & { types?: readonly string[] | DOMStringList }): string {
  const text = clipboard.getData('text/plain');
  if (text) return text;
  const types = [...(clipboard.types ?? [])];
  const uriList = types.includes('text/uri-list') ? clipboard.getData('text/uri-list') : '';
  const link = uriList.split(/\r?\n/u).map(line => line.trim()).find(line => line && !line.startsWith('#'));
  if (link) return link;
  // Mozilla's flavor is the link, a line break, then its title.
  return types.includes('text/x-moz-url') ? clipboard.getData('text/x-moz-url').split(/\r?\n/u)[0]?.trim() ?? '' : '';
}
