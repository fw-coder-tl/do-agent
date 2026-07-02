# Dodo Agent Frontend

Vite + Vue 3 + TypeScript 新前端，部署在 Spring Boot 的 `/new-ui/` 路径，与根路径旧静态前端并存。

## 开发

```bash
npm install
npm run dev
```

开发地址：`http://localhost:5173/new-ui/`（`base` 默认为 `/new-ui/`，与 Spring 部署路径一致）

## 构建

### 本地构建（输出到 `frontend/dist`）

```bash
npm run build
```

### 构建并部署到 Spring Boot 静态目录

```bash
npm run build:spring
```

产物复制到：

```
src/main/resources/static/new-ui/
```

启动后端后访问：

```
http://localhost:8888/new-ui/
```

旧前端仍可通过根路径访问，例如 `http://localhost:8888/`。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_BASE_PATH` | Vite `base`，静态资源前缀 | `/new-ui/` |
| `VITE_BACKEND_URL` | 后端 API 地址 | `http://localhost:8888` |

## 约束说明

- `npm run build:spring` 不会修改或覆盖 `src/main/resources/static/index.html`
- 新前端仅写入 `static/new-ui/`，旧 `static/` 根目录资源保持不变
- 复制脚本在删除/写入前会校验目标路径，仅允许操作 `src/main/resources/static/new-ui`；若路径不符合预期会立即中止，避免误删 `static/` 根目录或其他目录
