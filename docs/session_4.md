R3 审查轮开始。首先刷新工作区，获取 owner 新提交（session_3.md、remediation-plan-aurelia-r2.md 等）。
远程 main（7784b62）超前于本地（65aacf8），执行 pull：
拉取成功——新提交仅新增 `docs/session_3.md`（owner 会话日志）。R2 修复（65aacf8 主题切换 + axe 4.14）已在库中。现在读取本轮关键文档：
session_3.md 是 R2 轮的执行记录：主题缺陷已根因修复（两态切换 + 预绘脚本）、axe 4.14 Label-in-Name 缺陷修复、全门禁绿、DEPLOYMENT.md 重写。现在读 R2 整改计划与 worklog：
R2 记录已内化：主题缺陷已修复（65aacf8），全门禁绿（75/75 unit、166/166 e2e、437.01 KB）。本轮 R3 的新焦点：**Sitemap 实现与 SEO 优化检查**（参照 ecommerce-store.git 模板）。现在读根文档与 skills-catalog：
根文档已读——关键信息：`prebuild` 已再生 `public/sitemap.xml` + `robots.txt`（AGENTS 提及 `npm run seo:generate`），`src/lib/seo.ts` 在层级表。现在读 README、SKILL 及最新的 prompt 文档（确认本轮官方范围）：
prompt-to-validate-5.md 属于另一项目（homenest-store-g）——当前 R3 prompt 即用户消息本身。README 确认 SEO 层已存在（`scripts/generate-sitemap.mjs`、`public/sitemap.xml`+`robots.txt`、JSON-LD、PWA）。现在审计当前 SEO 实现与 skills-catalog：
Sitemap 已有 7 个静态 URL。读 SEO 源码实现：
SEO 层实现良好——生成器注释已标注遵循 ecommerce-store 模板。读 index.html（静态回退 + JSON-LD），并拉取 ecommerce-store 模板的 sitemap 实现作对照：
对照结果：模板 sitemap 含 `lastModified`（lastmod），克隆目前缺失。继续审计 public/ 产物、路由矩阵与 SEO 测试：
路由矩阵与 sitemap 覆盖一致（私有面正确排除）。查 SEO 测试与 ecommerce-store 模板的 robots/metadata 实现作对照：
robots 姿态与模板一致、SEO 测试覆盖良好。现在读 SKILL 文档与 skills-catalog（选择本轮审计技能）：
技能库确认（tdd、tailwind-patterns、code-review-checklist、agent-browser、clone-app-pat-pro 可用）。读项目 SKILL 文档：
发现疑似文档漂移：SKILL §2 版本表仍是 R2 前的值（Tailwind 4.1.17 / React 19.2.6 / ~407.9 KB），而 frontmatter 已是 R2 后状态（437 KB）。验证 package.json 实际版本：
确认缺陷：SKILL §2 版本表漂移（4 处）。继续通读 SKILL 全文找其他漂移点：
SKILL 全文已读。现在审计 R2 修复代码（最近变更）+ 查看 chrome.tsx 主题切换实现：
注意：输出中的 `ode, setMode]` / `}, ode]);` 是 session_3 已确认的**工具显示伪影**（`[m` 序列被吞）。字节级验证确认：
代码完好，伪影确认。现在建立基线：安装依赖并跑 verify 门禁：
验证绿色（构建 437.01 KB / gzip 116.07）。确认单元计数与 dist 产物：
基线绿：75/75 单元测试、dist SEO 产物齐全。后台启动完整 e2e（最长门禁），同时继续 SEO 审计：
SEO 审计成形。核对几个关键事实：STUDIO_INFO.instagram、matchPath 对 /home 的处理、.env 契约、SKILL 行数声明：
事实核对完成（/home 可达 → canonical 归一化有效；instagram handle 在 catalog 中）。检查 e2e 基线进度：
后台进程不跨调用存活（已知沙箱特性）。前台运行完整 e2e 基线：
**基线确认：166/166 e2e 全绿**。更新任务状态，启动 dev server 测试跨调用存活能力：
确认：本地进程不跨调用存活——所有 clone 探测须在单次调用内完成。检查 agent-browser 可用性：
eval 引号问题，修正后重探：
写持久化探测脚本避免引号地狱：
Clone head 全量确认（og:image 尺寸/alt、og:locale、apple-touch-icon 缺失 = R3-02/05 实锤）。继续探测 404 与子路由 + 参考站 head：
404 路由 robots=index,follow + canonical 指向垃圾 URL → R3-04 实锤（soft-404 缺陷）。现在探测参考站 head 作对照：
参考站 head 实测：无 JSON-LD、无 theme-color（克隆为 superset ✓）；**description 措辞与参考不同**（参考是泛型 Base44 文案）——需查 reference-investigation.md 的记录。再探参考站 robots/sitemap：
参考站 sitemap：5 URL、无 lastmod——克隆 7 URL 为对齐 superset。现在做移动菜单深检 + 视觉 spot-check（单调用内完成）：
移动菜单结构全绿（portal/dialog/36px/mt=0px 陷阱钉）。补做暗色跟随检查（修正选择器）：
逐步排查（可见输出）：
疑点：点击后 stored 仍为 system——疑似选择器命中了隐藏的桌面 toggle。检查 Header 渲染顺序并在桌面视口隔离测试：
桌面点击完美（dark/stored/bg 全对——R2 修复存活）。移动端问题是**我的探测选择器命中了 display:none 的桌面 toggle**（DOM 顺序在前）；e2e 用 getByRole（a11y 树只含可见元素）不受影响。用可见作用域选择器复验移动端：
状态是上次持久化的 dark，未证明移动端点击。干净复测：重置 storage + eval 定位可见按钮点击：
**移动端主题切换完美复验**：fresh→applied=light（预绘脚本✓），点击1→dark 可见翻转（R2-01a 修复在移动端存活），点击2→light。此前“失败”纯属探测选择器伪影（命中隐藏桌面按钮）。现在对照参考站移动菜单（settle 规程）：
参考站 ground 仍为 cream、Cormorant 确认——无漂移（R1 字节级证据 + 视觉 parity spec 钉住）。审计完毕，进入 TDD 实施。先完整读三个待改测试文件：
测试文件读完。核对 hero.jpg 实际尺寸与 studio.ts 营业时间（为 og:image 标签与 openingHoursSpecification 提供真实数据）：
全部事实就绪。写版本化整改计划 `docs/remediation-plan-aurelia-r3.md`：
计划落盘。**TDD RED 阶段**——扩展单元测试：
检查编辑结果的文件尾部（疑似消息混入）：
文件完好（编辑响应中的尾巴只是回显噪声）。扩展 sitemap 测试：
运行单元测试确认 RED：
RED 确认（seo ×2、sitemap ×1）。**GREEN 阶段**——实现 seo.ts 的 robots 契约与 /home 别名归一：
HeadManager 加 robots upsert：
实现 sitemap 生成器的 git-derived lastmod：
再生 SEO 产物并验证单元 GREEN：
单元测试通过（28/28，lastmod=2026-10-19 git 派生）。**e2e RED**——扩展 seo-head spec：
GREEN 实现——先生成图标资产：
更新 index.html（R3-02/05/06）与 manifest：
修正 openingHoursSpecification 为数组形式（与 e2e 断言及 Google 惯例一致）+ 更新 manifest：
检查 pwa-manifest e2e 是否会因新增 maskable 条目而受影响：
pwa spec 兼容（contains 断言）。跑完整技术门禁（typecheck + lint + 79 unit + build）：
170/172——R3-02 静态头测试双项目失败。查失败详情：
根因：`vite-plugin-singlefile` 的 `base:'./'` 把根绝对 href 重写为相对（pwa spec 已记录同类行为）。修正 e2e 断言为真实契约（href 以 icon-180.png 结尾 + 文件实际可服务）：
seo-head 26/26。跑完整 e2e 确认 172/172：
**172/172 e2e 全绿**。现在修 SKILL §2 版本表（R3-DOC-1）+ 核对 §5 行数声明：
SKILL §2 版本表 + §5 行数声明修正：
现在更新其余文档（README/AGENTS/CLAUDE/PAD/DEPLOYMENT）。README：
README 90 行还有一处 166，修正 + AGENTS/CLAUDE 计数：
CLAUDE 计数 + AGENTS 构建尺寸检查：
PAD 更新（SR-R3 修订条目 + 计数 + SEO 段落）：
DEPLOYMENT.md 对齐检查：
DEPLOYMENT.md 对齐 R3（lastmod、计数、图标、尺寸）：
文档对齐完成。截图捕获（21–23，Pillow 门禁）——检查现有捕获脚本：
写 R3 捕获脚本（延续版本化系列 21–23）：
agent-browser 守护进程 CWD 不同——需绝对路径输出。用绝对路径重跑：
3/3 捕获通过 Pillow 门禁，高度与既有系列完全一致（1920×5226 / 390×5846——head 侧变更零布局漂移）。快速目检一张：
像素采样确认渲染正确（奶油地面 + 墨带 + 摄影主视觉）。更新 worklog：
同步工作区级 worklog + 终查变更集：
变更集干净（16 改 + 6 新）。同步工作区 worklog 并提交：
提交 `883a050` 完成。SSH wrapper push（密钥仓库外 0600 → dry-run → push → 验证 → shred）：
PATH 需前置 shim 目录。重试 dry-run：
Dry-run 干净（7784b62..883a050）。执行真实 push：
推送完整验证：remote main = local HEAD = `883a050`，工作树干净，密钥已 shred（exit 2 仅为对已删文件的 ls 确认）。收尾：
# 审查轮 R3 完成 — Sitemap/SEO 审计与加固

**提交 `883a050` 已推送至 `origin/main` 并验证**（remote = local HEAD，工作树干净，密钥已 shred）。

## 本轮结论

**Sitemap/SEO 检查（本轮核心指令）**：基础实现已被证实存在且测试完备（7 URL sitemap + robots、逐路由 head 契约、JSON-LD、PWA）。对照 `ecommerce-store` 模板（`sitemap.ts`/`robots.ts`）与**参考站实时探测**后，TDD 修复 6 项差距：

| # | 严重度 | 修复 |
|---|---|---|
| R3-04 | **Medium** | 软 404 曾带 `index, follow` + 垃圾 URL 自指 canonical → 现在 `noindex, follow`（`RouteMeta.robots` + HeadManager upsert） |
| R3-01 | Low | sitemap 增加 git 派生 `<lastmod>`（确定性，非构建时间戳；无 git 时响亮省略） |
| R3-03 | Low | `/home` 别名 canonical 归一至 `/`（消除重复内容竞争） |
| R3-02 | Low | 社交卡元数据补全（og:image 1344×768/alt、twitter:alt、og:locale） |
| R3-05 | Low | apple-touch-icon 180px + maskable 清单条目（图标已生成入库） |
| R3-06 | Low | NailSalon JSON-LD `sameAs`（catalog 中的 Instagram）+ `openingHoursSpecification` |
| R3-DOC-1 | Medium(docs) | SKILL §2 版本表仍是 R2 前数值 — 已校正 |

**复审证据**：R2 主题修复在双视口实时复验（每次点击均翻转 ✓）；移动菜单陷阱全数存活（`mt: 0px` v4 钉 ✓）；参考站无 JSON-LD/theme-color——克隆 superset 地位保持。捕获 21–23 高度与前系列逐字节一致（纯 head 侧变更，零布局漂移）。

**台账**：typecheck ✓ lint ✓ **79/79 单元** ✓ **172/172 e2e** ✓ 构建 438.31 KB ✓；版本化计划 `docs/remediation-plan-aurelia-r3.md`；README/AGENTS/CLAUDE/PAD/SKILL/DEPLOYMENT 全对齐。

**建议下一步**：① 目检截图 21–23；② 部署时记得设 `VITE_SITE_URL` 并从 git clone 构建（lastmod 依赖 git 元数据，DEPLOYMENT §5 已注明）；③ 可选改进：GitHub Actions CI 仍是 standing LOW 项。
