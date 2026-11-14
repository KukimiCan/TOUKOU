// front 担当のファイル。
// 問題の確認・公開の画面（#156）。画面は端末の高さに収め、問題の一覧だけを ScrollArea の中でスクロールさせる。
// 最初の画面は科目の一覧。押すと /questions?course=<id> の、その科目の問題だけの一覧へ。
// 問題の一覧と、押したときに開く詳細（Modal）は question-review-list.tsx が行う。
// - 開いたときに、自分の問題（GET /api/questions）と、科目へたどるための資料（GET /api/materials）、
//   科目（GET /api/courses）を読み込み、問題の materialId → 資料の courseId で科目に分ける
// - 読み込み中は、一覧の形に近い骨格を出す。読み込めなかったとき・ログインしていないときは、それぞれの表示を出す
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { type Course, coursesResponseSchema } from "@/contracts/courses";
import { materialsResponseSchema } from "@/contracts/materials";
import { type Question, questionsResponseSchema } from "@/contracts/questions";

import { fetchApi } from "./fetch-api";
import { LoadError } from "./load-error";
import { Mascot } from "./mascot";
import {
  BackToCourses,
  buildCourseEntries,
  CourseList,
  UNKNOWN_COURSE,
  UNKNOWN_COURSE_NAME,
} from "./course-list";
import { EmptyQuestions, QuestionReviewList } from "./question-review-list";
import { QuizScreen } from "./quiz-screen";
import { Screen, ScrollArea } from "./ui/screen";

type Load =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | {
      status: "ready";
      questions: Question[];
      // 資料の ID → 科目の ID
      courseOfMaterial: Map<string, string>;
      courses: Course[];
    };

async function loadQuestions() {
  const [questionsRes, materialsRes, coursesRes] = await Promise.all([
    fetchApi("/api/questions"),
    fetchApi("/api/materials"),
    fetchApi("/api/courses"),
  ]);
  const { questions } = questionsResponseSchema.parse(
    await questionsRes.json(),
  );
  const { materials } = materialsResponseSchema.parse(
    await materialsRes.json(),
  );
  const { courses } = coursesResponseSchema.parse(await coursesRes.json());
  const courseOfMaterial = new Map(materials.map((m) => [m.id, m.courseId]));
  return { questions, courseOfMaterial, courses };
}

// 読み込み中の骨格。一覧の行（番号、問題文 2 行、公開の印）の形を並べる
function QuestionsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col">
      <span className="sr-only">問題を読み込んでいます</span>
      <div aria-hidden className="flex shrink-0 justify-center pb-2">
        <Mascot expression="smug" bob size={72} decorative />
      </div>
      {[0, 1, 2].map((n) => (
        <div
          key={n}
          aria-hidden
          className="border-line flex items-start gap-3 border-b py-4"
        >
          <div className="skeleton h-4 w-7" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
          <div className="skeleton h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

// 読み込み中の画面（loading.tsx でも、同じ枠で出す）
export function QuestionsLoadingScreen() {
  return (
    <Screen label="Questions" title="問題">
      <QuestionsSkeleton />
    </Screen>
  );
}

export function QuestionsScreen() {
  const searchParams = useSearchParams();
  const courseParam = searchParams.get("course");
  // mode=quiz のとき、その科目の問題を解く画面を出す
  const quizMode = searchParams.get("mode") === "quiz";
  const [load, setLoad] = useState<Load>({ status: "loading" });
  // 「もう一度読み込む」を押した回数。変わるたびに読み込み直す
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // 読み込みの途中で画面を離れたら、結果を使わない
    let ignore = false;
    loadQuestions()
      .then((data) => {
        if (!ignore) setLoad({ status: "ready", ...data });
      })
      .catch((error: unknown) => {
        if (!ignore) setLoad({ status: "error", error });
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  function retry() {
    setLoad({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  if (load.status === "loading") {
    return <QuestionsLoadingScreen />;
  }

  if (load.status === "error") {
    return (
      <Screen label="Questions" title="問題">
        <LoadError
          error={load.error}
          title="問題を読み込めませんでした"
          loginMessage="ログインすると、問題を確認して公開できます。"
          onRetry={retry}
        />
      </Screen>
    );
  }

  const { questions, courseOfMaterial, courses } = load;
  const known = new Set(courses.map((c) => c.id));
  // 問題の科目：materialId → 資料の courseId。時間割に無い科目、資料が見つからない問題は「時間割に無い科目」
  const groupOf = (q: Question) => {
    const courseId = courseOfMaterial.get(q.materialId);
    return courseId && known.has(courseId) ? courseId : UNKNOWN_COURSE;
  };

  function handlePublished(id: string, shareId: string) {
    setLoad((prev) =>
      prev.status === "ready"
        ? {
            ...prev,
            questions: prev.questions.map((q) =>
              q.id === id ? { ...q, isPublic: true, shareId } : q,
            ),
          }
        : prev,
    );
  }

  // 科目の中
  const selected =
    courseParam === UNKNOWN_COURSE
      ? { id: UNKNOWN_COURSE, name: UNKNOWN_COURSE_NAME }
      : courses.find((c) => c.id === courseParam);
  const mine = selected && questions.filter((q) => groupOf(q) === selected.id);
  if (selected && mine && mine.length > 0) {
    const courseHref = `/questions?course=${encodeURIComponent(selected.id)}`;
    if (quizMode) {
      return (
        <QuizScreen
          key={selected.id}
          questions={mine}
          title={selected.name}
          listHref={courseHref}
        />
      );
    }
    return (
      <QuestionReviewList
        questions={mine}
        title={selected.name}
        label={<BackToCourses href="/questions" />}
        onPublished={handlePublished}
        quizHref={`${courseHref}&mode=quiz`}
      />
    );
  }

  // 科目の一覧（問題がある科目だけ）
  const counts = new Map<string, number>();
  for (const q of questions) {
    counts.set(groupOf(q), (counts.get(groupOf(q)) ?? 0) + 1);
  }
  const entries = buildCourseEntries(
    courses,
    new Date(),
    (id) => counts.get(id) ?? 0,
    (n) => `問題 ${n}`,
    { hideEmpty: true },
  );
  const publicCount = questions.filter((q) => q.isPublic).length;

  return (
    <Screen
      label="Questions"
      title="問題"
      actions={
        questions.length > 0 && (
          <p className="text-muted text-sm whitespace-nowrap">
            公開
            <span className="font-display text-foreground mx-1 text-lg font-semibold tabular-nums">
              {publicCount}
            </span>
            /
            <span className="font-display mx-1 text-lg tabular-nums">
              {questions.length}
            </span>
            問
          </p>
        )
      }
    >
      {questions.length === 0 ? (
        <EmptyQuestions />
      ) : (
        <ScrollArea className="border-line -mx-4 border-t px-4 sm:-mx-6 sm:px-6">
          <CourseList
            entries={entries}
            basePath="/questions"
            ariaLabel="科目"
          />
        </ScrollArea>
      )}
    </Screen>
  );
}
