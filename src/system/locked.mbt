let mouse_locked : Ref[Bool] = { val: false }
let keyboard_locked : Ref[Bool] = { val: false }

pub fn lock_mouse() -> Unit {
  mouse_locked.val = true
}

pub fn unlock_mouse() -> Unit {
  mouse_locked.val = false
}

pub fn is_mouse_locked() -> Bool {
  mouse_locked.val
}

pub fn lock_keyboard() -> Unit {
  keyboard_locked.val = true
}

pub fn unlock_keyboard() -> Unit {
  keyboard_locked.val = false
}

pub fn is_keyboard_locked() -> Bool {
  keyboard_locked.val
}
