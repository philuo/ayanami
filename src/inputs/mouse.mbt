///|
#valtype
pub(all) enum MouseButton {
  Left
  Right
  Middle
} derive(Eq, Show)

///|
pub(all) struct Mouse {
  mut pos : @math.Vec2
  mut left : Bool
  mut right : Bool
  mut middle : Bool
}

pub(all) struct MouseChanged {
  mut left : Bool
  mut right : Bool
  mut middle : Bool
}

///|
pub(all) struct MouseMovement {
  mut movement : @math.Vec2
}

///|
pub let mouse_movement : MouseMovement = { movement: @math.Vec2(0.0, 0.0) }

///|
/// 【本次】鼠标数据
pub let mouse : Mouse = {
  pos: @math.Vec2(0.0, 0.0),
  left: false,
  right: false,
  middle: false,
}

///|
/// 【上次】鼠标数据
let last_mouse : Mouse = {
  pos: @math.Vec2(0.0, 0.0),
  left: false,
  right: false,
  middle: false,
}

///|
/// 【差值】本次新增的鼠标按钮集合
pub let just_pressed_mouse : MouseChanged = {
  left: false,
  right: false,
  middle: false,
}

///|
/// 【差值】本次释放的鼠标按钮集合
pub let just_released_mouse : MouseChanged = {
  left: false,
  right: false,
  middle: false,
}

///|
pub fn advanced_mouse_system(_dt : Double) -> Unit {
  // Just pressed
  just_pressed_mouse.left = mouse.left && !last_mouse.left
  just_pressed_mouse.right = mouse.right && !last_mouse.right
  just_pressed_mouse.middle = mouse.middle && !last_mouse.middle

  // Just released
  just_released_mouse.left = !mouse.left && last_mouse.left
  just_released_mouse.right = !mouse.right && last_mouse.right
  just_released_mouse.middle = !mouse.middle && last_mouse.middle

  // Update last mouse
  last_mouse.pos = mouse.pos
  last_mouse.left = mouse.left
  last_mouse.right = mouse.right
  last_mouse.middle = mouse.middle
}

pub fn is_mouse_pressed(button: MouseButton) -> Bool {
  match button {
    Left => mouse.left
    Right => mouse.right
    Middle => mouse.middle
  }
}

pub fn is_mouse_released(button: MouseButton) -> Bool {
  match button {
    Left => !mouse.left
    Right => !mouse.right
    Middle => !mouse.middle
  }
}

pub fn is_mouse_just_pressed(button: MouseButton) -> Bool {
  match button {
    Left => just_pressed_mouse.left
    Right => just_pressed_mouse.right
    Middle => just_pressed_mouse.middle
  }
}

pub fn is_mouse_just_released(button: MouseButton) -> Bool {
  match button {
    Left => just_released_mouse.left
    Right => just_released_mouse.right
    Middle => just_released_mouse.middle
  }
}
