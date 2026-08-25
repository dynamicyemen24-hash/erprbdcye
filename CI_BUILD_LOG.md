[36mvite v6.4.3 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 2313 modules transformed.
[31m✗[39m Build failed in 3.91s
[31merror during build:
[31m[vite]: Rollup failed to resolve import "react-is" from "/home/runner/work/erprbdcye/erprbdcye/node_modules/recharts/es6/util/ReactUtils.js".
This is most likely unintended because it can break your application at runtime.
If you do want to externalize this module explicitly add it to
`build.rollupOptions.external`[31m
    at viteLog (file:///home/runner/work/erprbdcye/erprbdcye/node_modules/vite/dist/node/chunks/dep-Dm0c1Wj2.js:46504:15)
    at file:///home/runner/work/erprbdcye/erprbdcye/node_modules/vite/dist/node/chunks/dep-Dm0c1Wj2.js:46562:18
    at onwarn (file:///home/runner/work/erprbdcye/erprbdcye/node_modules/@vitejs/plugin-react/dist/index.js:76:7)
    at file:///home/runner/work/erprbdcye/erprbdcye/node_modules/vite/dist/node/chunks/dep-Dm0c1Wj2.js:46560:7
    at onRollupLog (file:///home/runner/work/erprbdcye/erprbdcye/node_modules/vite/dist/node/chunks/dep-Dm0c1Wj2.js:46552:5)
    at onLog (file:///home/runner/work/erprbdcye/erprbdcye/node_modules/vite/dist/node/chunks/dep-Dm0c1Wj2.js:46202:7)
    at file:///home/runner/work/erprbdcye/erprbdcye/node_modules/rollup/dist/es/shared/node-entry.js:21200:32
    at Object.logger [as onLog] (file:///home/runner/work/erprbdcye/erprbdcye/node_modules/rollup/dist/es/shared/node-entry.js:23185:9)
    at ModuleLoader.handleInvalidResolvedId (file:///home/runner/work/erprbdcye/erprbdcye/node_modules/rollup/dist/es/shared/node-entry.js:21930:26)
    at file:///home/runner/work/erprbdcye/erprbdcye/node_modules/rollup/dist/es/shared/node-entry.js:21888:26[39m
