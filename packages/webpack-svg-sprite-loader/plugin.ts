import type { Compilation, Compiler, Module, NormalModule } from "webpack";
import type { SvgAttributes } from "./transform.js";
import type { Config as SvgoConfig } from "svgo";

import webpack from "webpack";

import { createHash } from "crypto";
import { join, relative } from "path";
import { pluginName } from "./constants.js";
import { optimize } from "svgo";

export type SpriteType = "global" | "module" | "entry" | "raw" | "inline";
export type SpriteTypeDetector = (resourcePath: string) => SpriteType | null;
export type SymbolIdParser = (resourcePath: string, rootPath: string) => string;

export interface SvgSymbol {
  resourcePath: string;
  symbolId: string;
  attributes: SvgAttributes;
}

export interface ContentfulSvgSymbol extends SvgSymbol {
  content: string;
}

export interface SvgSpritePluginOptions {
  defaultBehavior: SpriteType;
  optimize: boolean;
  symbolParser: SymbolIdParser;
  typeDetector: SpriteTypeDetector;
}

function hashStr(str: string): string {
  return createHash("md5").update(str).digest("hex");
}

function parseSymbolId(resourcePath: string, rootPath: string): string {
  return hashStr(relative(rootPath, resourcePath));
}

function detectImportType(resourcePath: string): SpriteType | null {
  if (resourcePath.endsWith(".global.svg")) {
    return "global";
  }
  if (resourcePath.endsWith(".module.svg")) {
    return "module";
  }
  if (resourcePath.endsWith(".entry.svg")) {
    return "entry";
  }
  if (resourcePath.endsWith(".raw.svg")) {
    return "raw";
  }
  if (resourcePath.endsWith(".inline.svg")) {
    return "inline";
  }
  return null;
}

type SpriteMap = Map<string, ContentfulSvgSymbol>;

export class SvgSpritePlugin {
  readonly PLUGIN_NAME = pluginName;
  readonly defaultBehavior: SpriteType;
  readonly optimize: boolean;
  readonly symbolParser: SymbolIdParser;
  readonly typeDetector: SpriteTypeDetector;
  checksums = new Map<string, string>();
  sprites = new Map<string, SpriteMap>();
  outputPath = 'sprites'
  placeholder: string
  placeholderChar = '␚'

  constructor(options?: SvgSpritePluginOptions) {
    this.defaultBehavior = options?.defaultBehavior ?? "global";
    this.optimize = options?.optimize ?? true;
    this.symbolParser = options?.symbolParser ?? parseSymbolId;
    this.typeDetector = options?.typeDetector ?? detectImportType;
    this.placeholder = this.placeholderChar.repeat(this.outputPath.length + 37);
  }

  detectImportType(resourcePath: string): SpriteType {
    return this.typeDetector(resourcePath) ?? this.defaultBehavior;
  }

  getSvgoOptions(): SvgoConfig {
    return {
      plugins: [
        {
          name: "preset-default",
          params: {
            overrides: {
              removeViewBox: false,
            },
          },
        },
        { name: "removeXMLNS" },
      ],
    };
  }

  getSymbolId(resourcePath: string, rootPath: string): string {
    return this.symbolParser(resourcePath, rootPath);
  }

  parseSvg(source: string): string {
    if (this.optimize) {
      return optimize(source, this.getSvgoOptions()).data;
    }
    return source;
  }

  getSprite(spriteFilePath: string): SpriteMap {
    const sprite = this.sprites.get(spriteFilePath);
    if (!sprite) {
      throw new Error(`Sprite ${spriteFilePath} was not found`);
    }
    return sprite;
  }

  apply(compiler: Compiler): void {
    this.tapInCompilation(compiler);
  }

  tapInCompilation(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      this.tapInProcessAssets(compilation);
    });
  }

  tapInProcessAssets(compilation: Compilation): void {
    compilation.hooks.seal.tap(pluginName, () => {
      this.emitSprites(compilation);
      this.materializePlaceholders(compilation);
    })
  }

  /** @FIXME: Sprites are not emitted when source SVGs are cached. This is an
   * edge case where the built sprites are eliminated by a side effect, such as
   * user deliberately removing them from dist folder */
  emitSprites(compilation: Compilation): void {
    for (const [path, sprite] of this.sprites.entries()) {
      const content = this.getSpriteContent(sprite);
      const source = new webpack.sources.RawSource(content)
      const checksum = hashStr(content);
      this.checksums.set(path, checksum);
      compilation.emitAsset(this.getSvgAbsPath(checksum), source);
    }
  }

  /** Materialize placeholder in a specific module. This only works because the
   * placeholder is the same length as the sprite path */
  replaceSpritePlaceholder(spritePath: string, resourcePath: string, compilation: Compilation): void {
    const mod = this.getResourceModule(resourcePath, compilation);
    // @ts-ignore
    const source = mod._source._value
    const newSource = source.replace(this.placeholder, spritePath);
    // @ts-ignore
    mod._source = mod.createSource(
      mod.context || '',
      newSource,
      null,
      compilation.compiler.root
    );
  }

  replaceSpritePlaceholders(spritePath: string, sprite: SpriteMap, compilation: Compilation): void {
    for (const svg of sprite.values()) {
      this.replaceSpritePlaceholder(spritePath, svg.resourcePath, compilation)
    }
  }

  materializePlaceholders(compilation: Compilation): void {
    for (const [path, sprite] of this.sprites.entries()) {
      const checksum = this.checksums.get(path)
      if (checksum) {
        const spritePath = this.getSvgAbsPath(checksum);
        this.replaceSpritePlaceholders(spritePath, sprite, compilation)
      } else {
        throw new Error(`Failed to find checksum for ${path} in webpack-svg-sprite-loader.`)
      }
    }
  }

  getResourceModule(resourcePath: string, compilation: Compilation): NormalModule {
    for (const mod of compilation.modules.values()) {
      const m = mod as NormalModule
      if (m.resource === resourcePath) {
        return m
      }
    }
    throw new Error(`Failed to identify webpack module for "${resourcePath}"`);
  }

  getResourceEntrypoint(resourcePath: string, compilation: Compilation): NormalModule {
    const mod = this.getResourceModule(resourcePath, compilation)
    let entry = mod
    while (true) {
      const issuer = compilation.moduleGraph.getIssuer(entry)
      if (issuer && issuer !== mod) {
        entry = issuer as NormalModule
      } else {
        const dep = entry.dependencies.find(dep => compilation.moduleGraph.getModule(dep) === entry)
        if (dep) {
          const parent = compilation.moduleGraph.getParentModule(dep)
          if (parent && parent !== entry) {
            entry = parent as NormalModule
          } else {
            break
          }
        } else {
          break
        }
      }
    }
    if (entry) {
      return entry
    }
    throw new Error(`Failed to identify webpack entry point for "${resourcePath}"`);
  }

  getGlobalSpritePath(): string {
    return this.getSvgAbsPath(hashStr("global.svg"));
  }

  getSvgAbsPath(name: string): string {
    return join(this.outputPath, `${name}.svg`)
  }

  getEntrypointSpritePath(resourcePath: string, compilation: Compilation): string {
    const entrypoint = this.getResourceEntrypoint(resourcePath, compilation);
    const entrypointPath = entrypoint.resource
    if (entrypointPath) {
      return this.getSvgAbsPath(hashStr(entrypointPath));
    }
    return this.getGlobalSpritePath();
  }

  getModuleIssuer(resourcePath: string, compilation: Compilation): Module | null {
    const mod = this.getResourceModule(resourcePath, compilation);
    return compilation.moduleGraph.getIssuer(mod)
  }

  getModuleSpritePath(resourcePath: string, compilation: Compilation): string {
    const issuer = this.getModuleIssuer(resourcePath, compilation)
    const issuerPath = (issuer as NormalModule)?.resource
    if (issuerPath) {
      return this.getSvgAbsPath(hashStr(issuerPath));
    }
    return this.getGlobalSpritePath();
  }

  getSpriteTarget(
    resourcePath: string,
    type: SpriteType,
    compilation: Compilation
  ): string {
    if (type === "global") {
      return this.getGlobalSpritePath();
    }
    if (type === "entry") {
      return this.getEntrypointSpritePath(resourcePath, compilation);
    }
    if (type === "module") {
      return this.getModuleSpritePath(resourcePath, compilation);
    }
    throw new Error(
      `Failed to determine sprite target for "${resourcePath}" of type "${type}"`
    );
  }

  getOrCreateSprite(spriteFilePath: string): SpriteMap {
    try {
      return this.getSprite(spriteFilePath);
    } catch (e) {
      const sprite = new Map<string, ContentfulSvgSymbol>();
      this.sprites.set(spriteFilePath, sprite);
      return sprite;
    }
  }

  addSpriteSvg(spriteFilePath: string, icon: ContentfulSvgSymbol): void {
    const sprite = this.getOrCreateSprite(spriteFilePath);
    sprite.set(icon.symbolId, icon);
  }

  serializeSvg(svg: ContentfulSvgSymbol): string {
    const viewBox = `viewBox="${svg.attributes.viewBox}"`;
    return `<symbol ${viewBox} id="${svg.symbolId}">${svg.content}</symbol>`;
  }

  getSpriteContent(sprite: SpriteMap): string {
    const svgs = Array.from(sprite.values())
      .map((svg) => this.serializeSvg(svg))
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${svgs}</svg>`;
  }
}
