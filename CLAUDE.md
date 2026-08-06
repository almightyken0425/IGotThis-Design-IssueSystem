# CLAUDE.md

本 repo 為 IGotThis 產品的 **Module Design git**，module_id 為 `no1_issue_system`，承載工單管理系統的設計工件與 design canvas，形式為 React HTML workbench。

## 多層 git 配對

- **頂層 Product git：**
    - 位於 `../../`
    - 管理決策框架的上游各層
- **本 Module Design git：**
    - 即本 repo
    - 位於 Product git 的 `no4_product_designs/no1_issue_system/`
- **對側 Module Spec git：**
    - 位於 Product git 的 `no3_product_specs/no1_issue_system/`
    - 承載行為規格
- **對側 Module Impl git：**
    - 位於 Product git 的 `no5_product_development/no1_issue_system/`
    - 桌面瀏覽器工單管理系統，repo 待建

完整路徑與配對表由 `decision_framework_router` skill 的 `products_registry.md` 維護。

---

## 內容概覽

本 repo 是一份 React HTML 設計 sandbox，不需建置流程，瀏覽器直接打開即可執行。

入口：`project/IGotThis.html`，由 `90_workbench/app.jsx` 作 router，目前 2 個頂層 tab：

- **Intro** — 本 repo 的使用說明書
- **Foundations** — 設計標準視覺化，目前僅 Atomic 一個 group，leaf 為 Colors / Type / Layout。group 與 leaf 清單以 `90_workbench/app.jsx` 的 `FOUNDATIONS_GROUPS` 為唯一真相，本檔不重複列表

token 檔位於 `10_foundations/`，三檔分別承載色彩與主題、字體、版面原語。視覺化卡片位於 `10_foundations/visualizers/`，只讀活 token 渲染、不定義 token。

未來擴充 Component Tokens、Components、Screens、Explorations 時，照同機制的 SuSuGiGi design canvas 節奏補目錄與 router 入口。

---

## 撰寫規範

本 repo 的內容是設計工件，即 JSX 與原型程式碼，不適用 `spec_writer` skill 政策。

- 所有 .md 文件仍適用 `universal_writing_linter` 通用政策
- JSX 不適用 spec 撰寫政策
- 任何改動前先 consult `decision_framework_router` skill 的上游 review 四問

---

## Design git 作為設計標準仲裁端

本 repo 在 IGotThis 多層 git 中擔任**設計標準的仲裁端**：

- **觸發點可來自任一端：** impl 開發發現視覺問題、Design 探索想換方向、Spec 邏輯需要新狀態，任一端都可以發起變動訊號
- **決議寫進本 repo：** token 的最終決議寫在 `10_foundations/`，spec 與 impl 跟隨對齊；impl 的 theme 檔照 export 名稱逐名對齊
- **本 repo 仲裁範圍：** 視覺與互動標準，即 token、元件、畫面
- **不仲裁範圍：** data model 與 logic 由 Spec git 仲裁

---

## 設計標準錨點

色彩方向已定案，主色走 Pine 深墨綠青、底色走暖白紙感，全域不留冷灰白。

- **主色種子：** `#004643`，落 `PRIMARY_PINE` 的 800 階，直接承主要按鈕；700 承 key 文字與選取邊線、600 承頭像底
- **底色種子：** `#F0EDE5`，落 `PALETTE.sand` 的 100 階、即畫布底；紙面比畫布底亮一階、不是純白
- **中性色：** sand 暖階取代原 slate 冷灰階，階位鍵不變、消費端零改動；暗主題同樣由 sand 深階往下推，不回冷灰
- **決策來源：** Explorations 的 color-directions 主題，十二案並列比較後選用 L · Pine Paper 深林紙感；該頁保留作決策紀錄、不再是待選清單
- **其餘 v1 初稿標準不變：** semantic 四色、system font 基準 14px 緊湊階梯、4px 網格、圓角 4 與 6 與 8、elevation 三階、光暗雙主題且 light 為預設

---

## 配對變動規則

同步關係由 `products_registry.md` 中 IGotThis 條目下 `no1_issue_system` 的 `sub_mapping` 維護，該檔為權威來源。配對 commit 使用相同 subject 與 body，branch 名稱逐字一致。
