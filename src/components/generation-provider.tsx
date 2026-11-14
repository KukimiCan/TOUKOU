// front 担当のファイル。
// 板書の解説を裏で作る仕組み（全体で 1 つ）。layout.tsx の Provider が持つので、画面を移っても作り続ける。
// - startGeneration(資料の id, 科目名) で作り始める。待たせず、画面は移らない
// - generatingIds：作っている最中の資料の id（一覧の行や、詳細のボタンに出すため）
// - notices：終わったときの知らせ（成功・失敗）。6 秒で自動で消える。表示は generation-toasts.tsx
// - revision：資料が変わったときに増える番号（一覧を取り直す合図）
// - lastCompleted：作り終えた資料の id（詳細の画面が、自分の資料が終わったかを見る合図）
"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { generateMaterialResponseSchema } from "@/contracts/materials";

import { errorMessage, fetchApi } from "./fetch-api";

// 知らせを消すまでの時間（ミリ秒）
const NOTICE_MS = 6000;
// 同時に出す知らせの数（多すぎると、画面の上を塞ぐため）
const MAX_NOTICES = 3;

export type Notice =
  | { id: number; kind: "success"; materialId: string; courseName: string }
  | {
      id: number;
      kind: "failure";
      materialId: string;
      courseName: string;
      message: string;
    };

type GenerationState = {
  generatingIds: ReadonlySet<string>;
  notices: Notice[];
  dismissNotice: (id: number) => void;
  startGeneration: (materialId: string, courseName: string) => void;
  revision: number;
  notifyChanged: () => void;
  lastCompleted: { materialId: string } | null;
};

const GenerationContext = createContext<GenerationState | null>(null);

// AI に解説と確認問題を作ってもらう。AI の返事を待つので、少し時間がかかる
async function generate(materialId: string) {
  const res = await fetchApi(
    `/api/materials/${encodeURIComponent(materialId)}/generate`,
    { method: "POST" },
  );
  generateMaterialResponseSchema.parse(await res.json());
}

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [generatingIds, setGeneratingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [notices, setNotices] = useState<Notice[]>([]);
  const [revision, setRevision] = useState(0);
  const [lastCompleted, setLastCompleted] = useState<{
    materialId: string;
  } | null>(null);
  // 作っている最中の id の控え（同じ資料を二重に作らないため、すぐ読める場所に持つ）
  const inFlight = useRef(new Set<string>());
  const noticeSeq = useRef(0);

  const dismissNotice = useCallback((id: number) => {
    setNotices((prev) => prev.filter((notice) => notice.id !== id));
  }, []);

  const pushNotice = useCallback(
    (build: (id: number) => Notice) => {
      noticeSeq.current += 1;
      const id = noticeSeq.current;
      setNotices((prev) => [...prev.slice(-(MAX_NOTICES - 1)), build(id)]);
      window.setTimeout(() => dismissNotice(id), NOTICE_MS);
    },
    [dismissNotice],
  );

  const startGeneration = useCallback(
    (materialId: string, courseName: string) => {
      if (inFlight.current.has(materialId)) return;
      inFlight.current.add(materialId);
      setGeneratingIds(new Set(inFlight.current));

      generate(materialId)
        .then(() =>
          pushNotice((id) => ({
            id,
            kind: "success",
            materialId,
            courseName,
          })),
        )
        .catch((e: unknown) =>
          pushNotice((id) => ({
            id,
            kind: "failure",
            materialId,
            courseName,
            message: errorMessage(e),
          })),
        )
        .finally(() => {
          inFlight.current.delete(materialId);
          setGeneratingIds(new Set(inFlight.current));
          setRevision((n) => n + 1);
          setLastCompleted({ materialId });
        });
    },
    [pushNotice],
  );

  const notifyChanged = useCallback(() => setRevision((n) => n + 1), []);

  const value = useMemo<GenerationState>(
    () => ({
      generatingIds,
      notices,
      dismissNotice,
      startGeneration,
      revision,
      notifyChanged,
      lastCompleted,
    }),
    [
      generatingIds,
      notices,
      dismissNotice,
      startGeneration,
      revision,
      notifyChanged,
      lastCompleted,
    ],
  );

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration(): GenerationState {
  const value = useContext(GenerationContext);
  if (!value) {
    throw new Error("useGeneration は GenerationProvider の中で使ってください");
  }
  return value;
}
