///|
struct Entity(UInt) derive(Eq, Show, Hash)

///|
let all_entities : Set[Entity] = Set::new()

///|
pub fn iter_entities() -> Iter[Entity] {
  all_entities.iter()
}

///|
pub fn Entity::is_alive(e : Entity) -> Bool {
  all_entities.contains(e)
}

///|
let entity_generator : Ref[UInt] = { val: 0 }

///|
pub fn Entity::new() -> Entity {
  let entity = entity_generator.val
  entity_generator.val += 1
  Entity(entity)
}

pub fn Entity::destroy(e: Entity) -> Unit {
  ...
}
