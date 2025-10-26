///|
let deferred_events : Array[Event] = Array::new()

///|
pub fn deferred_event_system(_dt : Double) -> Unit {
  for event in deferred_events {
    event()
  }
  deferred_events.clear()
}

///|
pub fn defer_event(event : Event) -> Unit {
  deferred_events.push(event)
}
