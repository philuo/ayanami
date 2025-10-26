priv struct Camera {
  pos: @math.Vec2
  mut limit_top: Double?
  mut limit_bottom: Double?
  mut limit_left: Double?
  mut limit_right: Double?
  mut attached_entity: @entity.Entity?
  mut offset: @math.Vec2
  mut follow_x: Bool
  mut follow_y: Bool
}

let camera: Camera = {
  pos: @math.Vec2(0.0, 0.0),
  limit_top: None,
  limit_bottom: None,
  limit_left: None,
  limit_right: None,
  attached_entity: None,
  offset: @math.Vec2(0.0, 0.0),
  follow_x: true,
  follow_y: true,
}

pub fn get_position() -> @math.Vec2 {
  camera.pos
}

pub fn set_limits(
  top?: Double,
  bottom?: Double,
  left?: Double,
  right?: Double,
) -> Unit {
  camera.limit_top = top
  camera.limit_bottom = bottom
  camera.limit_left = left
  camera.limit_right = right
}

pub fn attach_entity(entity: @entity.Entity, offset: @math.Vec2) -> Unit {
  camera.attached_entity = Some(entity)
  camera.offset = offset
}

pub fn set_follow(x?: Bool, y?: Bool) -> Unit {
  if x is Some(follow_x) {
    camera.follow_x = follow_x
  }
  if y is Some(follow_y) {
    camera.follow_y = follow_y
  }
}

pub fn camera_system(_dt: Double) -> Unit {
  guard camera.attached_entity is Some(e) else { return }
  guard @position.positions.get(e) is Some(pos) else { return }

}

