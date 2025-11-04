console.log('\n=== WASM Backend Test ===');
import fs from 'node:fs';

const wasmUrl = './target/wasm-gc/release/build/ayanami.wasm';
const memory = await new WebAssembly.Memory({ initial: 1024, maximum: 65536, shared: false });
const { instance: { exports } } = await WebAssembly.instantiate(
  fs.readFileSync(wasmUrl), 
  {
    spectest: {
      print_char(a) {
        // console.log(a)
      }
    },
    env: {
      memory,
      log: console.log.bind(console),
      console_log: console.log.bind(console)
    }
  },
  {
    builtins: ["js-string"],
    importedStringConstants: "_"
  }
);

console.log("Available exports:", Object.keys(exports));

// Test console_log from MoonBit
console.log("Calling initialize()...");
exports.initialize();

console.log("WASM test completed successfully!");
