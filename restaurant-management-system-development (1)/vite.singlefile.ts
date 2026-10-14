import type { OutputAsset, OutputBundle, OutputChunk, OutputOptions } from 'rollup';
import type { Plugin, UserConfig } from 'vite';

function applySingleFileBuildConfig(config: UserConfig): UserConfig {
  const build = config.build ?? {};
  const rollupOptions = build.rollupOptions ?? {};
  const configuredOutput = rollupOptions.output;
  const withInlineImports = (output: OutputOptions = {}) => ({
    ...output,
    inlineDynamicImports: true,
  });
  const output = Array.isArray(configuredOutput)
    ? configuredOutput.map((item) => withInlineImports(item))
    : withInlineImports(configuredOutput);

  return {
    ...config,
    base: './',
    build: {
      ...build,
      assetsInlineLimit: () => true,
      chunkSizeWarningLimit: 100_000_000,
      cssCodeSplit: false,
      assetsDir: '',
      rollupOptions: {
        ...rollupOptions,
        output,
      },
    },
  };
}

function assetText(asset: OutputAsset): string {
  return typeof asset.source === 'string'
    ? asset.source
    : new TextDecoder().decode(asset.source);
}

function replaceScript(html: string, chunk: OutputChunk): string {
  const escapedFilename = chunk.fileName.replace(/\./g, '\\.');
  const scriptTag = new RegExp(
    `<script([^>]*?) src="(?:[^"]*?/)?${escapedFilename}"([^>]*)></script>`
  );
  const script = chunk.code
    .replace(/"?__VITE_PRELOAD__"?/g, 'void 0')
    .replace(/<(\/script>|!--)/g, '\\x3C$1');

  return html.replace(
    scriptTag,
    (_match, beforeSource: string, afterSource: string) =>
      `<script${beforeSource}${afterSource}>${script.trim()}</script>`
  );
}

function replaceStylesheet(html: string, asset: OutputAsset): string {
  const escapedFilename = asset.fileName.replace(/\./g, '\\.');
  const linkTag = new RegExp(
    `<link([^>]*?) href="(?:[^"]*?/)?${escapedFilename}"([^>]*)>`
  );
  const css = assetText(asset).replace('@charset "UTF-8";', '');

  return html.replace(
    linkTag,
    (_match, beforeHref: string, afterHref: string) =>
      `<style${beforeHref}${afterHref}>${css.trim()}</style>`
  );
}

/**
 * The app is published as a static GitHub Pages site. Inline the generated JS
 * and CSS into index.html so the build remains a portable single-file app.
 * This app-specific version keeps the same default behavior as
 * vite-plugin-singlefile (MIT, Richard Tallent) without its glob-matching dependency.
 */
export function singleFilePlugin(): Plugin {
  return {
    name: 'comanda-pro-single-file',
    apply: 'build',
    config: applySingleFileBuildConfig,
    enforce: 'post',
    generateBundle(_options, bundle: OutputBundle) {
      const htmlAssets = Object.values(bundle).filter(
        (item): item is OutputAsset => item.type === 'asset' && /\.html?$/i.test(item.fileName)
      );
      const javascriptChunks = Object.values(bundle).filter(
        (item): item is OutputChunk => item.type === 'chunk' && /\.[mc]?js$/i.test(item.fileName)
      );
      const cssAssets = Object.values(bundle).filter(
        (item): item is OutputAsset => item.type === 'asset' && /\.css$/i.test(item.fileName)
      );
      const inlinedFiles = new Set<string>();

      for (const htmlAsset of htmlAssets) {
        let html = assetText(htmlAsset);
        for (const chunk of javascriptChunks) {
          html = replaceScript(html, chunk);
          inlinedFiles.add(chunk.fileName);
          this.info(`Inlining: ${chunk.fileName}`);
        }
        for (const stylesheet of cssAssets) {
          html = replaceStylesheet(html, stylesheet);
          inlinedFiles.add(stylesheet.fileName);
          this.info(`Inlining: ${stylesheet.fileName}`);
        }
        htmlAsset.source = html;
      }

      for (const filename of inlinedFiles) delete bundle[filename];
      for (const item of Object.values(bundle)) {
        if (item.type === 'asset' && !/\.html?$/i.test(item.fileName)) {
          this.info(`NOTE: asset not inlined: ${item.fileName}`);
        }
      }
    },
  };
}
