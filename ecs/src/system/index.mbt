///|
const DEFAULT_CANVAS_HEIGHT = 256.0

///|
const DEFAULT_CANVAS_WIDTH = 512.0

///|
const DEFAULT_FPS : UInt = 60

///|
const DEFAULT_ZOOM: Double = 1.0

// pub type System = (Double) -> Unit
// pub type Plugin = (App) -> Unit

pub typealias (Double) -> Unit as System
pub typealias (App) -> Unit as Plugin
///|
pub typealias () -> Unit as Event


///|
pub(all) enum Schedule {
  Startup
  Update
  Render(Int) // priority
}
