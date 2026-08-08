import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

// このプロジェクトのESLintは react-hooks/exhaustive-deps 1本に絞っている。
// 目的は、useEffect の依存配列の入れ忘れを機械的に止めること。
// （2026年8月8日、依存配列に turnstileHostReady を入れ忘れてAI生成が
//  本番で使えなくなる障害が起きたため導入した。型チェックでは検出できない。）
//
// 実行は npm run lint（tsc --noEmit と同時に走る）。
// Vercelのビルド経路には入れていない。誤検知でデプロイが止まるのを避けるため。
export default [
  {
    // 既存の eslint-disable コメント16件は、ルールが無効でも意図の記録として残す。
    // 未使用として警告されると --max-warnings 0 で lint が落ちるため抑制する。
    linterOptions: { reportUnusedDisableDirectives: "off" },
  },
  {
    ignores: ["node_modules/**", ".next/**", "public/**", "scripts/**"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    // @next/next と @typescript-eslint はルールを一切有効にせず、登録だけ行う。
    // 登録しないと、既存の eslint-disable コメントが参照するルール名を解決できず
    // 「Definition for rule ... was not found」でエラーになる。
    plugins: {
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
