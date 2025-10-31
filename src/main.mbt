///|
pub fn memory_size() -> Int = "(func (result i32) (memory.size))"

///|
pub fn memory_grow(delta : Int) -> Int =
  #|(func (param $delta i32) (result i32) (memory.grow (local.get $delta)))

///|
pub fn memory_copy(dest : Int, source : Int, len : Int) =
  #|(func (param $dest i32) (param $source i32) (param $len i32) (memory.copy (local.get $dest) (local.get $source) (local.get $len)))

///|
pub fn memory_fill(dest : Int, val : Int, len : Int) =
  #|(func (param $dest i32) (param $val i32) (param $len i32) (memory.fill (local.get $dest) (local.get $val) (local.get $len)))

///|
pub fn load32(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load align=4 (local.get $pos)))

///|
pub fn load64(pos : Int) -> Int64 =
  #|(func (param $pos i32) (result i64) (i64.load align=8 (local.get $pos)))

///|
pub fn loadf32(pos : Int) -> Float =
  #|(func (param $pos i32) (result f32) (f32.load align=4 (local.get $pos)))

///|
pub fn loadf64(pos : Int) -> Double =
  #|(func (param $pos i32) (result f64) (f64.load align=8 (local.get $pos)))

///|
pub fn load8_s(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load8_s (local.get $pos)))

///|
pub fn load8_u(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load8_u (local.get $pos)))

///|
pub fn load16_s(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load16_s align=2 (local.get $pos)))

///|
pub fn load16_u(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load16_u align=2 (local.get $pos)))

///|
pub fn load64_8u(pos : Int) -> Int64 =
  #|(func (param $pos i32) (result i64) (i64.load8_u (local.get $pos)))

///|
pub fn load32_u(pos : Int) -> UInt =
  #|(func (param $pos i32) (result i32) (i32.load align=4 (local.get $pos)))

///|
// 存储 32 位整数（接受 Int，如需存储 UInt 可用 .reinterpret_as_int() 转换）
pub fn store32(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store align=4 (local.get $pos) (local.get $val)))

///|
pub fn store64(pos : Int, val : Int64) =
  #|(func (param $pos i32) (param $val i64) (i64.store align=8 (local.get $pos) (local.get $val)))

///|
pub fn storef32(pos : Int, val : Float) =
  #|(func (param $pos i32) (param $val f32) (f32.store align=4 (local.get $pos) (local.get $val)))

///|
pub fn storef64(pos : Int, val : Double) =
  #|(func (param $pos i32) (param $val f64) (f64.store align=8 (local.get $pos) (local.get $val)))

///|
pub fn store8(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store8 (local.get $pos) (local.get $val)))

///|
pub fn store16(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store16 align=2 (local.get $pos) (local.get $val)))

///|
pub fn game_loop(_dt : Double) -> Unit {
  // // 处理输入系统
  // @inputs.advanced_key_system(_dt)
  // @inputs.advanced_mouse_system(_dt)

  // 游戏逻辑...
  // @backend.log_number(_dt)

  // 测试：UInt 超过 Int 最大值的情况
  // let big_uint: UInt = 3000000000U  // 超过 Int::max_value (2147483647)

  // 方式1：直接传 UInt 给 store32(Int) - 会报类型错误 ✗
  // store32(2, big_uint)  // ❌ 编译错误！MoonBit 不允许

  // 方式2：使用 reinterpret_as_int 转换 ✓
  // store32(0, big_uint.reinterpret_as_int())  // 位模式不变，不会截断

  // let (head, tail) = keyboard_buffer.get_ptr()

  // @backend.log_number(load32_u(0).to_double())
  // @backend.log_number(_dt)
  // @backend.log_number((keyboard_buffer.tail()).to_double())
  // ignore(keyboard_buffer.size())
  @backend.log_number((keyboard_buffer.size()).to_double())
}

///|
pub fn game_start() -> Unit {
  @backend.app_start()
}

///|
pub fn game_stop() -> Unit {
  @backend.app_stop()
}

///|
///键盘按键事件对象
#valtype
pub struct KeyboardState {
  /// 事件触发时间(ms), 精确至小数点后3位(μs)
  timestamp : Float
  /// [MDN按键码简介](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values)
  /// [W3C按键码规范](https://www.w3.org/TR/uievents-code/)
  code : UInt16
  /// 按键事件类型: up(0), down(1)
  typ : UInt16
}

///|
fn KeyboardState::new(
  timestamp : Float,
  code : UInt,
  typ : UInt,
) -> KeyboardState {
  { timestamp, code: code.to_uint16(), typ: typ.to_uint16() }
}

///|
/// 环形缓冲区 - 基于固定内存布局
/// Memory Layout:
/// [0~1]   head (UInt16)
/// [2~3]   tail (UInt16)
/// [4~7]   capacity (UInt)
/// [8~]    data[] 每个 KeyboardState 占 8 字节
pub struct KeyboardBuffer {}
// 空结构体，所有数据存储在内存地址 0 开始

///|
/// 创建环形缓冲区（初始化内存）
pub fn KeyboardBuffer::new(capacity : UInt) -> KeyboardBuffer {
  store16(0, 0) // head = 0
  store16(2, 0) // tail = 0
  store32(4, capacity.reinterpret_as_int()) // capacity
  KeyboardBuffer::{  }
}

///|
pub fn KeyboardBuffer::get_ptr(_ : KeyboardBuffer) -> (UInt, UInt) {
  let head_tail = load32_u(0)
  (head_tail & 0xFFFF, head_tail >> 16)
}

///|
/// 获取 head 位置
pub fn KeyboardBuffer::head(_ : KeyboardBuffer) -> UInt {
  load16_u(0).reinterpret_as_uint()
}

///|
/// 获取 tail 位置
pub fn KeyboardBuffer::tail(_ : KeyboardBuffer) -> UInt {
  load16_u(2).reinterpret_as_uint()
}

///|
/// 获取容量
pub fn KeyboardBuffer::capacity(_ : KeyboardBuffer) -> UInt {
  load32_u(4)
}

pub fn KeyboardBuffer::size(_ : KeyboardBuffer) -> UInt {
  let tail_head = load32_u(0) // wasm使用小端字序 little-endian 低->高存储bit[低位数据, 高位数据]
  let head = tail_head & 0xFFFF
  let tail = tail_head >> 16

  match (head, tail) {
    (h, t) if t >= h => t - h
    (h, t) => keyboard_buffer.capacity() + t - h
  }
}

///|
/// 操作符[] - 读取指定索引的事件
#alias("_[_]")
pub fn KeyboardBuffer::get(_ : KeyboardBuffer, index : Int) -> KeyboardState {
  let offset = 8 + index * 8 // data 从地址 8 开始，每个事件 8 字节
  let timestamp = loadf32(offset)
  let code = load16_u(offset + 4).reinterpret_as_uint()
  let typ = load16_u(offset + 6).reinterpret_as_uint()
  KeyboardState::new(timestamp, code, typ)
}

///|
/// 写入指定索引的事件
pub fn KeyboardBuffer::set(
  _ : KeyboardBuffer,
  index : Int,
  state : KeyboardState,
) -> Unit {
  let offset = 8 + index * 8
  storef32(offset, state.timestamp)
  store16(offset + 4, state.code.to_int())
  store16(offset + 6, state.typ.to_int())
}

///|
/// 全局键盘事件缓冲区
pub let keyboard_buffer : KeyboardBuffer = KeyboardBuffer::new(255)

///|
pub fn initialize() -> UInt {
  keyboard_buffer.head()
  // let bytes : UInt = a
  // let mut head : UInt = bytes >> 16
  // let mut tail : UInt = bytes & 0xFFFF
  // if head > tail {
  //   let temp = head
  //   head = tail
  //   tail = temp
  // }
  // for i in head..=tail {

  // }

  // for i = head; i <= tail; i = i + 1 {

  // }
}

// // ========== 输入同步接口 ==========

// ///|
// /// 键盘按下事件
// pub fn on_key_down(key_code : String) -> Unit {
//   match @inputs.Code::from_string(key_code) {
//     Some(code) => @inputs.pressed_keys.add(code)
//     None => ()
//   }
// }

// ///|
// /// 键盘释放事件
// pub fn on_key_up(key_code : String) -> Unit {
//   match @inputs.Code::from_string(key_code) {
//     Some(code) => @inputs.pressed_keys.remove(code)
//     None => ()
//   }
// }

// ///|
// /// 鼠标移动事件
// pub fn on_mouse_move(x : Double, y : Double, movement_x : Double, movement_y : Double) -> Unit {
//   @inputs.mouse.pos = @math.Vec2(x, y)
//   @inputs.mouse_movement.movement = @math.Vec2(movement_x, movement_y)
// }

// ///|
// /// 鼠标按下事件
// pub fn on_mouse_down(button : Int) -> Unit {
//   match button {
//     0 => @inputs.mouse.left = true
//     1 => @inputs.mouse.middle = true
//     2 => @inputs.mouse.right = true
//     _ => ()
//   }
// }

// ///|
// /// 鼠标释放事件
// pub fn on_mouse_up(button : Int) -> Unit {
//   match button {
//     0 => @inputs.mouse.left = false
//     1 => @inputs.mouse.middle = false
//     2 => @inputs.mouse.right = false
//     _ => ()
//   }
// }
