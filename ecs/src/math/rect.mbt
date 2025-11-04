///|
#valtype
pub(all) struct Rect {
  x : Double
  y : Double
  w : Double
  h : Double
}

///|
pub fn Rect::new(x : Double, y : Double, w : Double, h : Double) -> Rect {
  { x, y, w, h }
}

///|
pub fn Rect::intersects(a : Rect, b : Rect) -> Bool {
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}
