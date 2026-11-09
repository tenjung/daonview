import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const runtimeRequire = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../..', import.meta.url));

/** Execute real TS modules with explicit I/O replacements; never load .env files. */
export function load(file, mocks = {}, runtimeProcess = process) {
  const filename = path.resolve(root, file);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loadedModule = { exports: {} };
  const localRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.startsWith('@/') || id.startsWith('.')) {
      const resolved = id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : path.resolve(path.dirname(filename), id);
      return load(`${resolved}.ts`, mocks, runtimeProcess);
    }
    return runtimeRequire(id);
  };
  vm.runInThisContext(`(function(require, module, exports, process) {${source}\n})`, { filename })(localRequire, loadedModule, loadedModule.exports, runtimeProcess);
  return loadedModule.exports;
}
