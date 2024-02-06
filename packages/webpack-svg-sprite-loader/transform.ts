export type SvgAttributes = Record<string, string | boolean | true | false>;

export interface TransformedSvg {
  attributes: SvgAttributes;
  content: string;
}

const attributeExtractPattern = /([\w-:]+)(=)?("[^<>"]*"|'[^<>']*'|[\w-:]+)/g;
const sourcePattern = /<svg(.*?)>(.*?)<\/svg>/i;

function normalizeAttributes(parsedAttributes?: string | null): SvgAttributes {
  if (parsedAttributes) {
    const extracted = parsedAttributes.match(attributeExtractPattern);
    if (extracted) {
      return extracted.reduce((result: SvgAttributes, attribute: string) => {
        const [name, unformattedValue] = attribute.split("=");
        result[name] = unformattedValue
          ? unformattedValue.replace(/['"]/g, "")
          : true;
        return result;
      }, {});
    }
  }
  return {};
}

export function transformSvg(source: string): TransformedSvg {
  const match = source.match(sourcePattern);
  if (match) {
    const [, parsedAttributes, content] = match;
    const attributes = normalizeAttributes(parsedAttributes);
    return {
      attributes,
      content,
    };
  }
  throw new Error(`Cannot parse SVG: '${source}'`);
}
