import type { SvgSpritePlugin } from "./plugin.js";
import type { Compiler, LoaderDefinition } from "webpack";

import { hashStr } from "./checksum.js";
import { pluginName } from "./constants.js";
import { SvgAttributes, transformSvg } from "./transform.js";

export interface SvgSymbolImport {
  symbolId: string;
  spritePath: string;
  attributes: SvgAttributes;
}

function getPluginInstance(compiler: Compiler): SvgSpritePlugin {
  const plugin = compiler.options.plugins.find(
    (plugin) =>
      plugin && "pluginName" in plugin && plugin?.pluginName === pluginName
  );
  if (!plugin) {
    throw new Error("Failed to find the SvgSpritePlugin in the webpack config");
  }
  // Glob knows what the plugin goes trough. We recognize it using the
  // pluginName and assume this is it.
  return plugin as unknown as SvgSpritePlugin;
}

export const SvgSpriteLoader: LoaderDefinition = function (
  source: string
): string {
  const compiler = this._compiler;
  const compilation = this._compilation;
  const resourcePath = this.resourcePath;
  if (!(compiler && compilation)) {
    throw new Error("Failed to bind webpack-svg-sprite-loader to compiler.");
  }
  const plugin = getPluginInstance(compiler);
  const iconSource = plugin.parseSvg(source);
  const { attributes, content } = transformSvg(iconSource);
  const symbolId = plugin.getSymbolId(resourcePath, this.rootContext);
  const type = plugin.detectImportType(resourcePath);
  if (type === "inline") {
    throw new Error(
      `Inlining from "webpack-svg-sprite-loader" is not yet implemented, cannot serve "${resourcePath}"`
    );
  }
  if (type === "raw") {
    return `export default ${JSON.stringify(content)}`;
  }
  const spritePath = plugin.getSpriteTarget(resourcePath, type, compilation);
  this.cacheable(false);
  plugin.addSpriteSvg(spritePath, {
    resourcePath,
    symbolId,
    attributes,
    content,
  });
  return `export default ${JSON.stringify({
    checksum: hashStr(iconSource),
    symbolId,
    spritePath: plugin.placeholder,
    attributes,
  })}`;
};
