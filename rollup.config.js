import typescript from "@rollup/plugin-typescript";
import pkg from './package.json'

export default {
  input: 'src/WebSocketServerSubject.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    },
  ],
  external: [
    'rxjs',
    'rxjs/internal-compatibility'
  ],
  plugins: [
    typescript()
  ]
}
