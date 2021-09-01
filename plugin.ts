import { basename } from 'https://deno.land/std@0.106.0/path/mod.ts'
import Processor from 'https://esm.sh/windicss@3.1.7'
import type { Plugin } from 'https://deno.land/x/aleph@v0.3.0-beta.9/types.d.ts'

export default <Plugin>{
  name: 'windicss',
  setup: aleph => {
    const windi = new Processor()
    aleph.onTransform(/\.(j|t)sx$/i, async ({ module, code }) => {
      const { specifier, jsxStaticClassNames } = module
      if (jsxStaticClassNames?.length) {
        const url = specifier.replace(/\.(j|t)sx$/i, '') + '.tailwind.css'
        const interpretedSheet = windi.interpret(jsxStaticClassNames.join(' ')).styleSheet
        const minify = aleph.mode === 'production'
        // todo: treeshake prefilght
        const css = interpretedSheet.extend(windi.preflight()).build(minify)
        const { jsFile, sourceHash } = await aleph.addModule(url, css, true)

        return {
          // import tailwind css
          code: `import "./${basename(jsFile)}#${sourceHash.slice(0, 8)}-${Date.now()}";` + code,
          // support SSR
          extraDeps: [{ specifier: url, virtual: true }],
        }
      }
    })
  }
}
