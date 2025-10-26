// WASM-GC后端如何使用JS通过env传来的console_log

在MoonBit的wasm-gc后端中，使用JS通过env模块传入的函数有特定的语法格式。

## 基本语法

```moonbit
pub fn console_log(msg: String) -> Unit = "env" "console_log"
```

### 语法解析

1. `pub fn console_log(msg: String) -> Unit` - 函数声明
   - `pub`: 公开函数，可以被外部调用
   - `console_log`: 函数名
   - `msg: String`: 参数类型为字符串
   - `-> Unit`: 返回值为Unit（无返回值）

2. `= "env" "console_log"` - 外部函数声明
   - `"env"`: 外部模块名，对应JS中的env对象
   - `"console_log"`: 外部函数名，对应JS中的函数名

## 配置要求

### 1. moon.pkg.json配置

```json
{
  "link": {
    "wasm-gc": {
      "use-js-builtin-string": true,
      "imported-string-constants": "_",
      "import-memory": {
        "module": "env",
        "name": "memory"
      }
    }
  }
}
```

### 2. JavaScript端实现

```javascript
const { instance: { exports } } = await WebAssembly.instantiate(
  wasmBuffer, 
  {
    env: {
      memory: memory,
      console_log: console.log.bind(console)
    }
  },
  {
    builtins: ["js-string"],
    importedStringConstants: "_"
  }
);
```

## 使用示例

在src/main.mbt中：

```moonbit
// 声明外部函数
pub fn console_log(msg: String) -> Unit = "env" "console_log"

pub fn initialize() -> Unit {
  console_log("Hello from MoonBit WASM!")
}
```

## 重要说明

1. **函数签名匹配**: MoonBit函数签名必须与JS函数兼容
2. **字符串支持**: 对于字符串参数，需要启用`use-js-builtin-string`
3. **内存共享**: 通过`import-memory`配置共享内存，便于数据传递
4. **导出函数**: 需要在`exports`数组中声明要导出的函数

## 其他常用env函数

```moonbit
// 动画帧请求
pub fn request_animation_frame(callback: (Double) -> Unit) -> UInt = "env" "requestAnimationFrame"
pub fn cancel_animation_frame(id: UInt) -> Unit = "env" "cancelAnimationFrame"

// 计时器
pub fn set_timeout(callback: () -> Unit, delay: Int) -> UInt = "env" "setTimeout"
pub fn clear_timeout(id: UInt) -> Unit = "env" "clearTimeout"
```

通过这种方式，MoonBit可以与JavaScript环境进行有效的交互。