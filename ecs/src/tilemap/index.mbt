pub struct TileMap {
  size: UInt
  width: UInt
  height: UInt
  layers: Array[TileLayer]
} derive(FromJson)

pub struct TileLayer {
  name: String
  collider: Bool
  tiles: Array[Tile]
} derive(FromJson)

pub struct Tile {
  id: UInt
  x: UInt
  y: UInt
} derive(FromJson)

pub fn TileMap::from_json(json: Json) -> TileMap {
  try! @json.from_json(json)
}

pub fn TileMap::get_tiles(self : TileMap, layer_name : String) -> Array[Tile] {
  self.layers
  .filter(layer => layer.name == layer_name)
  .get(0)
  .map_or([], layer => layer.tiles)
}
