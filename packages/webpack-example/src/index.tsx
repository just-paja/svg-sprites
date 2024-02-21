import React from "react";

import { createRoot } from "react-dom/client";
import { SvgSymbolImport } from "@jebka/webpack-svg-sprite-loader";

import * as def from "./default";
import * as glob from "./global";
// import * as inline from "./inline";
import * as mod from "./module";
import * as raw from "./raw";

const body = document.querySelector("body");

interface IconProps {
  svg: SvgSymbolImport;
}

function GlobalStyles() {
  const css = `
body,
body > div,
dl > div,
.icon-details {
  display: flex;
}

body {
  justify-content: center;
}

body > div {
  flex-direction: column;
}

dl dt {
  width: 5rem;
}

.icon-details {
  align-items: center;
}

.icon-render {
  max-width: 240px;
  min-width: 3rem;
  aspect-ratio: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #333;
  margin-right: 1rem;
}

  `;
  return <style>{css}</style>;
}

function RawIcon({ svg }: { svg: string }) {
  return (
    <div>
      {/* rome-ignore lint/security/noDangerouslySetInnerHtml: It is supposed to work like this */}
      <svg dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}

function Icon({ svg }: IconProps) {
  return (
    <div className="icon-details">
      <div className="icon-render">
        <svg {...svg.attributes}>
          <title>test</title>
          <use href={`${svg.spritePath}#${svg.symbolId}`} />
        </svg>
      </div>
      <dl>
        <div>
          <dt>spritePath</dt>
          <dd>
            <a href={svg.spritePath}>{svg.spritePath}</a>
          </dd>
        </div>
        <div>
          <dt>symbolId</dt>
          <dd>{svg.symbolId}</dd>
        </div>
        <div>
          <dt>attributes</dt>
          <dd>
            {Object.entries(svg.attributes)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")}
          </dd>
        </div>
      </dl>
    </div>
  );
}

interface ModuleProps {
  title: string;
  description?: string;
  icons: Record<string, SvgSymbolImport | string>;
}

function Module({ description, icons, title }: ModuleProps) {
  const render = Object.values(icons).map((icon) => {
    return typeof icon === "string" ? (
      <RawIcon svg={icon} key={icon} />
    ) : (
      <Icon svg={icon} key={icon.symbolId} />
    );
  });
  return (
    <section>
      <h1>{title}</h1>
      <p>{description}</p>
      {render}
    </section>
  );
}

function App() {
  return (
    <>
      <GlobalStyles />
      <Module
        title="Default"
        description="Default behaviour is to pull all SVGs into the global sprite"
        icons={def}
      />
      <Module
        title="Global"
        description="This sprite consolidates global SVGs"
        icons={glob}
      />
      <Module
        title="Module"
        description="This sprite consolidates module SVGs"
        icons={mod}
      />
      <Module
        title="Raw"
        description="RAW icons return only strings"
        icons={raw}
      />
    </>
  );
}

if (body) {
  const el = document.createElement("div");
  const root = createRoot(el);

  body.appendChild(el);
  root.render(<App />);
} else {
  console.error("No body");
}
