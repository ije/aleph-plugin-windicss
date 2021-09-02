import Processor from 'https://esm.sh/windicss@3.1.7'
import type { Plugin } from 'https://deno.land/x/aleph@v0.3.0-beta.10/types.d.ts'

export default <Plugin>{
  name: 'windicss',
  setup: aleph => {
    const windi = new Processor()
    aleph.onTransform(/\.(j|t)sx$/i, async ({ module, code, bundleMode }) => {
      const { specifier, jsxStaticClassNames } = module
      if (jsxStaticClassNames?.length) {
        const url = specifier.replace(/\.(j|t)sx$/i, '') + '.tailwind.css'
        const interpretedSheet = windi.interpret(jsxStaticClassNames.join(' ')).styleSheet
        const minify = aleph.mode === 'production'
        // todo: treeshake prefilght
        const css = interpretedSheet.extend(windi.preflight()).build(minify)
        const cssModule = await aleph.addModule(url, css, true)

        return {
          // import tailwind css
          code: `import "${aleph.resolveImport(cssModule, specifier, bundleMode, true)}";${code}`,
          // support SSR
          extraDeps: [{ specifier: url, virtual: true }],
        }
      }
    })
  }
}
