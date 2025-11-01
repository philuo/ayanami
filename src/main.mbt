///|
pub using @backend {
  store_f32,
  store_u64,
  load32_u16,
  load_u32,
  load_f32,
  load_u64
}

///|
/// 键盘输入事件环形缓冲区 - 基于固定内存布局
/// | Addr          | Byte      | Name     | Type    | Description |
/// |:--------------|:---------:|:--------:|:-------:|:------------|
/// | 0x00~0x01     | 2         | tail     | UInt16  | 队列尾索引   |
/// | 0x02~0x03     | 2         | head     | UInt16  | 队列头索引   |
/// | 0x04~0x05     | 2         | size     | UInt16  | 队列长度（0～65535）|
/// | 0x06~0x07     | 2         | capacity | UInt16  | 最大容量（65535）|
/// | 0x08~0x7FF    | 8 × 255   | data[]   | struct  | KeyboardState |
pub struct KeyboardBuffer(Unit)

///|
/// 全局键盘事件缓冲区
pub let keyboard_buffer : KeyboardBuffer = KeyboardBuffer::new(256)


///|
/// 队列指针(head, tail) | 访问指针(head, size)
#valtype
pub struct Ptr(UInt, UInt)

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
/// 创建环形缓冲区（初始化内存）
pub fn KeyboardBuffer::new(capacity : UInt) -> KeyboardBuffer {
  store_u64(0, (capacity.to_uint64() << 48).reinterpret_as_int64())
}

///|
/// 获取队列指针(tail, head)
pub fn KeyboardBuffer::get_ptr(_ : KeyboardBuffer) -> Ptr {
  let tail_head = load_u32(0)
  Ptr(tail_head >> 16, tail_head & 0xFFFF)
}

///|
/// 获取循环指针(head, size)
pub fn KeyboardBuffer::loop_ptr(_ : KeyboardBuffer) -> Ptr {
  let head_size = load_u32(2, align=2)
  Ptr(head_size & 0xFFFF, head_size >> 16)
}

///|
/// 获取 tail 位置
pub fn KeyboardBuffer::tail(_ : KeyboardBuffer) -> UInt {
  load32_u16(0)
}

///|
/// 获取 head 位置
pub fn KeyboardBuffer::head(_ : KeyboardBuffer) -> UInt {
  load32_u16(2)
}

///|
/// 键盘事件队列长度
pub fn KeyboardBuffer::size(_ : KeyboardBuffer) -> UInt {
  load32_u16(4)
}

///|
/// 键盘事件队列容积
pub fn KeyboardBuffer::capacity(_ : KeyboardBuffer) -> UInt {
  load32_u16(6)
}

///|
pub fn KeyboardBuffer::is_empty(self : Self) -> Bool {
  self.size() == 0
}

///|
/// 操作符[] - 读取指定索引的事件
#alias("_[_]")
pub fn KeyboardBuffer::get(_ : KeyboardBuffer, index : Int) -> KeyboardState {
  let offset = index * 8 + 8 // data 从地址 8 开始，每个事件 8 字节
  let timestamp = load_f32(offset)
  let code_typ = load_u32(offset + 4)
  KeyboardState::new(timestamp, code_typ & 0xFFFF, code_typ >> 16)
}

///|
pub fn initialize() -> Unit {
 ()
}

///|
pub fn game_loop(_dt : Double) -> Unit {
  
}

///|
pub fn game_start() -> Unit {
  @backend.app_start()
}

///|
pub fn game_stop() -> Unit {
  @backend.app_stop()
}
