declare module '*.raw.svg' {
  const rawContent: string
  export default rawContent
}

declare module '*.svg' {
  import { SvgSymbolImport } from 'webpack-svg-sprite-loader'
  const globalContent: SvgSymbolImport
  export default globalContent
}
