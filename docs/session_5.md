I'll continue with this review round (R4: validating `session_4.md` + `remediation-plan-aurelia-r3.md`). Let me set up the plan and refresh the workspace first.
The repo exists and is at the R3 commit. Let me pull to ensure it's current:
Pull 成功 — 远程有一个新的 commit `f83c48f` 添加了 `docs/session_4.md`。Local = remote。现在让我来读取会话日志和 R3 整改计划：
`session_4.md` 记录了 R3 轮次（sitemap/SEO 加固，commit `883a050`）。本轮为 **R4**：验证 R3 的成果。现在让我来阅读 R3 整改计划和 worklog：
Now the worklog and root docs:
Now README and the SKILL doc:
README read — I already spot a potential drift (architecture table lines 34–35 still say "75 tests / 166 tests" while everything else says 79/172). Let me read the SKILL doc and PAD:
SKILL 文件很大 —— 让我使用针对性的 `grep` 来验证数量敏感和版本敏感的声明：
Confirmed three doc-drift points already (SKILL frontmatter description + SKILL §3 quick commands still say 75/166; README architecture table too). Let me check SKILL §5 inventory + PAD claims:
Let me audit the R3 commit's actual code changes:
src 行数 = 2,965 ✓ 与 SKILL 一致。现在我来详细审查 R3 代码变更：
R3 SEO 核心代码差异审查完毕。现在轮到 index.html + manifest 的变更：
R3 的更改看起来实现得很好。现在开始验证既定的合约（`env`、`db`、`skills exclusion`）并安装依赖：
All standing contracts intact. Now install dependencies and run the baseline gate chain:
类型检查 + 代码规范检查已通过。现在进行单元测试 + 构建：
79/79 unit ✓, build 438.31 KB ✓ (matches R3's ledger exactly). Now the full e2e baseline:
输出看起来被截断了 —— 让我验证一下真实的 e2e 摘要：
164 e2e failures — that contradicts the R3 ledger (172/172). Per Mode B discipline, reproduce before diagnosing. Let me look at the failure detail:
Even trivial navigation fails — smells like infrastructure (browser/server), not code. Let me see the actual error:
Root cause: **sandbox reset wiped the Playwright browser cache** (`chromium_headless_shell-1248` missing) — the exact quirk documented in AGENTS.md. Not a code regression. Installing the browser:
Browser cache was the culprit — smoke now 18/18. Full e2e baseline:
**Baseline confirmed: 172/172 e2e ✓** — matches the R3 ledger. The failure storm was purely the sandbox's wiped browser cache (documented quirk). Now the sitemap/SEO audit — current artifacts + the case-sensitivity question:
Sitemap/robots artifacts are correct (7 URLs, git-derived lastmod ✓). Now checking the case-variant canonical question — the router is case-insensitive but canonical uses the raw pathname. Let me verify the pinned test contract:
The suite pins `/GALLERY` title normalization but **not** its canonical — and the code canonicalizes case-variants to their raw casing (`/Gallery` → `/Gallery`), competing with the sitemap's lowercase `/gallery`. Same defect family as R3-03. Let me check the remaining audit surfaces — DEPLOYMENT.md + full index.html:
index.html 和 DEPLOYMENT.md 是一致的。在浅色模式下一切正常——但我注意到 `theme-color` 是单一的静态浅色值；在深色模式下，移动端浏览器的 UI 会保持奶油色。让我检查一下主题 seam，看看如何进行干净的挂载：
`applyTheme` 是实现该对接的完美切入点。让我读取当前的完整 `seo.ts` 以及主题测试/规范文件，以评估 TDD 的改动：
Let me verify the ecommerce-store template's current SEO implementation (standing reference), and read the chrome.tsx theme sync block:
Template confirmed — the clone's 7-URL posture (incl. /login + /register at 0.2/yearly) mirrors the template exactly. And `applyTheme`'s sync hook (chrome.tsx:44-50) is the single seam for theme-color sync.

Now the live parity probe — writing a persistent single-call script (sandbox processes die between calls):
Probe results are decisive — all parity pins hold live (mobile menu TRAP-4 `mt:0px` ✓, two-state theme walk ✓, ground byte-equal to reference ✓), and **all three code findings are live-confirmed**:

1. `/Gallery` self-canonicalizes as `/Gallery` (competes with sitemap's `/gallery`)
2. `/account` (private) ships `index, follow`
3. `theme-color` stays `#f5f3ef` after dark flip (browser chrome tint doesn't follow)

Now writing the versioned R4 plan:
计划已撰写。现在是 **TDD RED 阶段** —— 让我阅读一下我将要扩展的 e2e 规范：
Now writing the **RED** tests. First the unit-level additions to `tests/seo.test.ts`:
Now the e2e RED additions — `seo-head.spec.ts`:
Now the dark-mode spec addition (theme-color sync pin):
Now confirm RED — unit first:
Unit RED confirmed (2 new tests failing). Now e2e RED — dist is still the pre-fix build, so the new served-artifact tests must fail:
**RED confirmed: 6/6 new e2e tests fail** (3 tests × 2 projects). Now **GREEN** — first `seo.ts`:
现在进行 theme.ts 的 `applyTheme` 同步以及 index.html 的修改：
现在修改 index.html —— 将 theme-color meta 移至 pre-paint 脚本上方并同步它：
All GREEN implementations in place. Rebuild and verify:
Unit 81/81 ✓, new e2e 6/6 ✓ (actual totals: 81 unit / 175 e2e — I'll correct the plan numbers). Build 439.19 KB. Now the full e2e regression run:
**178/178 e2e ✓** (172 + 3 new tests × 2 projects), **81/81 unit ✓**. Now the docs sweep — grep every count-bearing pattern across all six docs:
全量清单已捕获。新合计：**81 个单元 / 178 个端到端 / 约 439 KB**。现在扫描文档——先从 README 开始：
Now README's doc-map + status lines:
README 已完成。接下来是 AGENTS.md 和 CLAUDE.md：
Now the PAD (revision entry + counts + build sizes + theme row):
PAD 主要部分已完成。我来检查一下 PAD §4.1/§5.3 主题行中关于 theme-color 契约的说明：
PAD done. Now the SKILL — frontmatter, §2 table, §3 commands, anti-pattern #14, checklist, and appendix inventory:
SKILL done. Now DEPLOYMENT.md — size, pre-paint paragraph, checklist, troubleshooting:
All docs aligned. Now correct the plan doc's actual gate numbers (81 unit / 439.19 KB, not the predicted 82/438.37):
Two more plan corrections for internal consistency:
Plan doc consistent. Now the capture script — checking the R3 version to adapt:
Fixing two leftover labels, then running captures against the fresh production build:
所有 3 个捕获已通过门禁（高度与先前的系列一致 — 零布局偏移）。现在是后修复实时验证 + 像素抽检，一次调用：
**All three R4 fixes verified live on the served artifact** + pixel check confirms zero rendering shift. Now the final gate re-run and worklog updates:
Verify green. Appending the R4 record to the repo worklog:
All 17 files staged (+315/−54). Now materialize the SSH key outside the repo, commit, and push via the wrapper:
Key materialized (0600, outside the repo). The dry-run auth handshake will verify the key. Now commit + dry-run:
The sandbox reset also wiped pip packages — reinstalling paramiko and retrying:
PEP 668 block — creating a venv with paramiko and running the wrapper through it:
Dry-run clean: `f83c48f..62694b7 HEAD -> main` — key authenticated. Real push:
Push verified by the wrapper (`refs/heads/main @ 62694b7 == local HEAD`) — the traceback was my supplementary pkt-line parser, not the push. But the failure short-circuited the shred step — completing key cleanup now:
Everything is complete. Final task list update:
**审查轮 R4 完成** — commit `62694b7` 已推送至 `origin/main` 并验证（remote = local HEAD，工作树干净，密钥已 shred）。

## 本轮结论

**R3 成果验证**：`session_4.md` + R3 计划的全部声明与代码库逐项对齐（79/172 基线、438.31 KB 构建、lastmod、7 URL sitemap、R3 修复代码逐行审计）——唯一例外是 4 处 R3 计数迁移遗漏的文档漂移（本轮已修）。

**Sitemap/SEO 常设审计**（对照 ecommerce-store 模板 + 实时探测）：3 项 Low 缺陷全部实时复证后 TDD 修复：

| # | 修复 |
|---|---|
| R4-01 | 大小写变体路由自指 canonical（`/Gallery` ↔ sitemap 的 `/gallery` 竞争）→ 已知路由归一至小写形式 |
| R4-02 | 私有面（`/account`、`/admin/*`、`/reset`）曾带 `index, follow` → INDEXABLE 白名单（fails closed），robots.txt 大小写旁路被 meta 层兜底 |
| R4-03 | `theme-color` 恒为亮色 → 预绘脚本 + `applyTheme` 双缝同步，移动浏览器 chrome 跟随解析主题 |

**Parity 复验**：移动菜单全套陷阱存活（TRAP-4 `mt:0px` ✓）、两态主题每次点击翻转 ✓、与参考站地面逐字节一致 ✓；截图 24–26 高度与前系列完全一致（零布局漂移）。

**台账**：typecheck ✓ lint ✓ **81/81 单元** ✓ **178/178 e2e** ✓ 构建 439.19 KB ✓；版本化计划 `docs/remediation-plan-aurelia-r4.md`；六份文档全对齐；密钥已确认删除。

**建议下一步**：① 目检截图 24–26；② 部署时设 `VITE_SITE_URL` 并从 git clone 构建（DEPLOYMENT §5）；③ standing Low 项不变：GitHub Actions CI 仍缺。
