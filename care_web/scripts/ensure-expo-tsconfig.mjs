import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const target = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../node_modules/expo/tsconfig.base.json')
if (existsSync(target)) process.exit(0)

mkdirSync(path.dirname(target), { recursive: true })
writeFileSync(
  target,
  JSON.stringify(
    {
      compilerOptions: {
        jsx: 'react-jsx',
        moduleResolution: 'bundler',
        target: 'ESNext',
        strict: true,
      },
    },
    null,
    2,
  ),
)
