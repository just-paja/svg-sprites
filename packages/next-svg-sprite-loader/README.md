# `@jebka/next-svg-sprite-loader`

> Integrate [@jebka/webpack-svg-sprite-loader](https://github.com/just-paja/svg-sprites/tree/master/packages/webpack-svg-sprite-loader) into Next.js configuration

This is just a convenience package to make @jebka/webpack-svg-sprite-loader
work with less configuration. All the steps can be done manually. See the [docs of
@jebka/webpack-svg-sprite-loader](https://github.com/just-paja/svg-sprites/tree/master/packages/webpack-svg-sprite-loader).

# Installation

```
npm install --save-dev @jebka/next-svg-sprite-loader
```

# Configuration

The plugin amends the webpack config for Next.js, so it needs to be called
inside the webpack config hook function.

The convenience function mutates the config and also returns the same instance.

```javascript
import { configSvgSprites } from "@jebka/next-svg-sprite-loader";

export default {
  webpack(config) {
    return configSvgSprites(config, {
      // SvgSpritePluginOptions
    });
  },
};
```

# Manual Next.js configuration

See [the code](./index.ts), it has inline commentary.
