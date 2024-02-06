import type { LoaderOptions } from "./loader.js";

interface Icon {
  symbolId: string;
}

export class SvgSpriteGenerationState {
  readonly sprites = Map<string, Icon>;

  addSpriteIcon(icon: Icon, spriteFilePath: string): void {
    this.sprites[spriteFilePath] = this.sprites[spriteFilePath] || {};
    this.sprites[spriteFilePath][icon.symbolId] = icon;
  }

  getSpriteContent(
    spriteFilePath: string,
    options: LoaderOptions = {}
  ): string {
    return `${Object.keys(this.sprites[spriteFilePath]).reduce(
      (result, iconId) =>
        `${result}<symbol viewBox="${
          this.sprites[spriteFilePath][iconId].attributes.viewBox
        }"${options.unsetSymbolFill ? "" : ' fill="none"'} id="${iconId}">${
          this.sprites[spriteFilePath][iconId].content
        }</symbol>`,
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'
    )}</svg>`;
  }
}
