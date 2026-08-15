# IGotThis 工單系統設計規則

- 本 repo 是 Module Design git
- 產品為 IGotThis
- module id 為 `no1_issue_system`
- 工件形式為 React HTML workbench

## 多層配對

- Product git 承載上游決策
- Spec git 仲裁資料與邏輯
- 本 repo 仲裁視覺與互動
- Impl git 跟進設計定案
- 配對以 `decision_framework_router` 的註冊表為準

---

## 工件結構

- `project/IGotThis.html`
  - 是瀏覽器入口
- `90_workbench/app.jsx`
  - 承載 router
  - 群組常數是導覽真相
- `10_foundations/`
  - 承載原子 token
- `10_foundations/component_tokens/`
  - 承載元件狀態映射
- `10_foundations/visualizers/`
  - 只讀活 token
- `20_components/`
  - 承載元件與 showcase
- `30_screens/`
  - 承載畫面工件
- `50_explorations/`
  - 承載隔離探索

---

## 設計仲裁

- token 決議寫入 Foundations
- 元件決議寫入 Components
- 畫面決議寫入 Screens
- Impl 跟隨 export 名稱
- Spec 跟隨視覺狀態
- Explorations 不牽動下游
- Data Model 由 Spec 仲裁
- Logic 由 Spec 仲裁

---

## 設計錨點

- 主色種子為 `#004643`
- 底色種子為 `#F0EDE5`
- 中性色採 sand 暖階
- 紙面不得使用純白
- 深色主題不得回冷灰
- Light 是預設主題
- 系統字基準為 14px
- 版面使用 4px 網格
- 圓角採 4px 6px 8px
- elevation 採三階

---

## 原生工作規則

- 任何改動先使用 `decision_framework_router`
- Markdown 改動使用 `universal_writing_linter`
- JSX 不套用 `spec_writer`
- 同步範圍依註冊表 sub mapping
- 跨層 branch 名稱必須一致
- 配對 commit 內容必須一致

---

## 相容與漂移控制

- `AGENTS.md` 是本目錄的規則真相
- `CLAUDE.md` 只保留 Claude Code 入口
- 產品規則不得複製回相容入口
- 漂移檢查確認相容入口只含導向規則
