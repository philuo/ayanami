# ECS架构设计

## RingBuffer


### 比较调用开销

- JS监听输入事件
- 调用WASM中实现对SAB上的RingBuffer入队 / 出队
- JS直接操作SAB入队 / 出队

### 换一种方式实现RingBuffer

- 写法不同生成的优化后的wasm / wat文件是相同的
