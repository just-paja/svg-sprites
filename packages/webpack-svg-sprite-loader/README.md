# `webpack-svg-sprite-loader`

Loader for webpack, that helps you split SVGs into sprites based on the SVG
name and the entry point. This plugins should be useful for React, React-like
and JSX apps.

If you're using Next.js, you might want to check out
[next-svg-sprite-loader](../next-svg-sprite-loader).

## Why

On a large UI project, you might get into situation with hundreds of SVG icons.
Inlining SVGs is performance costly, however, embedding hundreds of icons into
a single SVG will be bandwidth costly.

This loader let's you decide how to optimize your SVGs.

- [Install](#install)
- [Configure](#configure)
- [Plug in](#plug-in)
- [Import](#import)
  - [Global Shared Sprite](#global-shared-sprite)
  - [Module Sprite](#module-sprite)
  - [Entrypoint Sprite](#entrypoint-sprite)
  - [Inline Import](#inline-import)
  - [Raw Import](#raw-import)
- [Caveats](#caveats)

## Install

```
npm install --save-dev webpack-svg-sprites
```

```
yarn add -D webpack-svg-sprites
```

## Configure

### `defaultBehavior`

The default behaviour applies to `.svg` files without recognizable prefix. By
default, the loader will put these into the [Global Shared
Sprite](#globalsharedsprite), but you can change this.

`global | shared | module | entry | raw  | inline`

### `optimize`

Turn on or off SVG optimization By default on.

`boolean`

### outputFolder

Folder that will contain built sprites. Default: `'sprites'`

`string`

### `typeDetector`

Override detection of the SVG import type. See [defaultBehavior](#defaultbehavior) for allowed values.

`(resourcePath: string) => SpriteType`

### `symbolParser`

Override the default symbol ID parsing function

`(resourcePath: string, rootPath: string) => string`

## Plug in

Put the plugin in your Webpack plugins. All options are optional and defaults
should be good enough for most projects.

```javascript
import SvgSpriteLoader from "webpack-svg-sprite-loader";

{
  // ...
  plugins: [
    new SvgSpriteLoader({
      // options
    }),
  ];
  // ...
}
```

And this in your webpack loaders

```javascript
{
  // ...
  loaders: [
    {
      test: /\.svg$/,
      loader: "webpack-svg-sprite-loader",
    },
  ];
  // ...
}
```

## Imports

All the import methods can be combined with single loader. If no import method
is specified, the loader will fall back to [defaultBehaviour
setting](#defaultbehavior).

- [Global Shared Sprite](#global-shared-sprite)
- [Module Sprite](#module-sprite)
- [Entrypoint Sprite](#entrypoint-sprite)
- [Inline Import](#inline-import)
- [Raw Import](#raw-import)

### Global Shared Sprite

Name your file with `.shared.svg` suffix. This will serve your SVG from a
single global sprite. This is the preferred way of importing SVGs, when you're
dealing with small amount of icons and you do not need extra features.

```
import HelloWorld from './hello-world.shared.svg`
```

### Module Sprite

Name your file with `.module.svg` suffix. This will serve your SVG from a sprite
generated from a barel file. This kind of optimization is useful for apps with
large amount of icons, where some are to features or components.

The SVG will get duplicated if it is imported from multiple files.

```
import HelloWorld from './hello-world.module.svg`
```

### Entrypoint Sprite

Name your file with `.entry.svg` suffix. This will serve your SVG from a sprite
generated for the entrypoint. This kind of optimization is useful for apps with
large amount of icons, where some are specific to views/pages.

The SVG will get duplicated if it is imported from multiple files.

```
import HelloWorld from './hello-world.entry.svg`
```

### Inline Import

Name your file with `.inline.svg` suffix. This will return JSX Component.

```
import HelloWorld from './hello-world.inline.svg`
```

### Raw Import

Name your file with `.inline.svg` suffix. This will return SVG string

```
import HelloWorld from './hello-world.inline.svg`
console.log(HelloWorld)
// '<svg>...</svg>'
```

## TypeScript

You will need to cast your SVG imports at your own. Create a `svg.d.ts` file
in your project:

```
import type { SvgSymbolImport } from 'webpack-svg-sprite-loader';

// based on your import paths
declare module '*.module.svg' {
	const content: SvgSymbolImport;
	export default content;
}
```

## Caveats

This plugin may break down in the future, because it is using the forbidden webpack loader API.
