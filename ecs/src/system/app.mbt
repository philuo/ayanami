///|
pub(all) struct App {
  canvas_height : Double
  canvas_width : Double
  zoom : Double
  image_smooth : Bool
  fps : UInt
  systems : Array[(System, Schedule, String)]
  plugins : Array[Plugin]
}

///|
pub fn App::new(
  canvas_width? : Double = DEFAULT_CANVAS_WIDTH,
  canvas_height? : Double = DEFAULT_CANVAS_HEIGHT,
  fps? : UInt = DEFAULT_FPS,
  zoom? : Double = DEFAULT_ZOOM,
  image_smooth?: Bool = true
) -> App {
  {
    canvas_width,
    canvas_height,
    fps,
    zoom,
    image_smooth,
    systems: [],
    plugins: [],
  }
}

///|
pub fn App::add_plugin(self : App, plugin : Plugin) -> Unit {
  self.plugins.push(plugin)
}

///|
pub fn App::add_system(
  self : App,
  system : System,
  system_name : String,
  schedule? : Schedule = Update,
) -> Unit {
  self.systems.push((system, schedule, system_name))
}

///|
pub fn App::run(self : App) -> Unit {
  for plugin in self.plugins {
    plugin(self)
  }
  fn startup() {
    for system in self.systems {
      if system.1 is Startup {
        (system.0)(0)
      }
    }
  }

  let renders : Array[(System, Int)] = []
  for system in self.systems {
    if system.1 is Render(pri) {
      renders.push((system.0, pri))
    }
  }
  renders.sort_by_key(renderTask => -renderTask.1)
  fn render_loop(delta : Double) {
    for render in renders {
      (render.0)(delta)
    }
  }

  let loops = []
  for system in self.systems {
    if system.1 is Update {
      loops.push(system.0)
    }
  }
  fn game_loop(delta : Double) {
    for system in loops {
      system(delta)
    }
  }
}
