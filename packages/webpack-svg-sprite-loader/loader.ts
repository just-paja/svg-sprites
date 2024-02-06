import loaderUtils from "loader-utils";

import { optimize } from "svgo";
import { svgSpriteState } from "./state.js";
import { transformSvg } from "./transform.js";

type SmybolIdParser = (resourcePath: string) => string;

export interface LoaderOptions {
  symbolId: string | SmybolIdParser;
  svgoOptimize: boolean;
}

const defaultOptions: LoaderOptions = {
  symbolId: "[name]",
  svgoOptimize: true,
};

export function svgSpriteLoader(source: string): string {
  const options: LoaderOptions = {
    ...defaultOptions,
    ...this.getOptions(),
  };

  const isSvgoOptimizeEnabled = !!options.svgoOptimize;
  const svgoOptimizeConfig =
    options.svgoOptimize === true
      ? {
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  removeViewBox: false,
                },
              },
            },
            "removeXMLNS",
          ],
        }
      : undefined;

  const iconSource = isSvgoOptimizeEnabled
    ? optimize(source, svgoOptimizeConfig).data
    : source;

  const { attributes, content } = transformSvg(iconSource);

  const symbolId = loaderUtils.interpolateName(
    this,
    typeof options.symbolId === "string"
      ? options.symbolId
      : options.symbolId(this.resourcePath)
  );

  if (this.target === "web") {
    svgSpriteState.addSpriteIcon(
      { symbolId, attributes, content },
      options.spriteFilePath
    );
  }

  return `
    export default ${JSON.stringify({
      symbolId,
      attributes,
      ...(options.addContent ? { content } : {}),
    })}
  `;
}
