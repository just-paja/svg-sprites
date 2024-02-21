import type { Configuration, RuleSetRule } from "webpack";
import {
  SvgSpritePlugin,
  SvgSpritePluginOptions,
} from "@jebka/webpack-svg-sprite-loader";

function findNextImageLoader(config: Configuration): RuleSetRule | null {
  const nextImageLoader = config?.module?.rules?.find((rule) => {
    if (rule && typeof rule === "object" && "loader" in rule) {
      return rule?.loader === "next-image-loader";
    }
    return false;
  });
  if (nextImageLoader) {
    return nextImageLoader as RuleSetRule;
  }
  return null;
}

export function configSvgSprites(
  config: Configuration,
  pluginConfig: SvgSpritePluginOptions
) {
  if (!config.plugins) {
    config.plugins = [];
  }
  config.plugins.push(
    new SvgSpritePlugin({
      /* The output folder must start with static, so the
         generated sprites are publicly accessible. */
      outputFolder: "static/sprites",
      ...pluginConfig,
    })
  );

  if (!config.module) {
    config.module = {};
  }

  if (!config.module.rules) {
    config.module.rules = [];
  }

  /* Next.js tries to handle SVG files by it's own, we need to turn
     that off */
  const nextImageLoader = findNextImageLoader(config);
  if (nextImageLoader) {
    /* Watch out when changing the suffix test, so you do not leave
       out something you'd miss */
    nextImageLoader.test = /\.(png|jpg|jpeg|gif|webp|avif|ico|bmp)$/i;
  } else {
    throw new Error(
      'The "next-svg-sprite-loader" failed to override the next image loader.'
    );
  }
  // And at last we plug in the SVG loader
  config.module.rules.push({
    test: /\.svg$/,
    loader: "@jebka/webpack-svg-sprite-loader",
  });
}
