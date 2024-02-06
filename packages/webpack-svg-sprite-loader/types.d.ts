import type { TransformedSvg } from "./transform.d.ts";

declare module "*.svg" {
  export default TransformedSvg;
}

declare module "*.global.svg" {
  export default TransformedSvg;
}

declare module "*.module.svg" {
  export default TransformedSvg;
}

declare module "*.entry.svg" {
  export default TransformedSvg;
}

declare module "*.raw.svg" {
  const content: string;
  export default content;
}

declare module "*.inline.svg" {
  import React = require("react");
  const SVG: React.VFC<React.SVGProps<SVGSVGElement>>;
  export default SVG;
}
