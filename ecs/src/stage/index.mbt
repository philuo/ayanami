pub typealias UInt as EntityId
pub typealias UInt as ComponentId
pub typealias UInt as ResourceId
pub typealias UInt as SystemId

#valtype
struct SystemAccess {
  reads: FixedArray[ComponentId]
  writes: FixedArray[ComponentId]
  resources: FixedArray[ResourceId]
}

fn[T: Eq] has_intersection(a: FixedArray[T], b: FixedArray[T]) -> Bool {
  let a_len = a.length()
  let b_len = b.length()
  
  guard a_len > 0 && b_len > 0 else { return false }

  loop (0, 0) {
    (i, j) if a[i] == b[j] => true
    (i, j) if i < j => continue (i + 1, j)
    (i, j) if i > j => continue (i, j + 1)
    _ => false
  }
}

fn system_conflict(a: SystemAccess, b: SystemAccess) -> Bool {
  let write_wirte = has_intersection(a.writes, b.writes)
  let read_write = has_intersection(a.reads, b.writes) || has_intersection(a.writes, b.reads)
  let resource_conflict = has_intersection(a.resources, b.resources)

  write_wirte || read_write || resource_conflict
}
