// front 担当のファイル。
// TOUKOU のキャラクター（紫色の小悪魔）。使う場面と表情の決まりは docs/design.md の「キャラクター」。
// - expression：smug（ニヤリ、基本）／tease（煽り）／praise（しぶしぶ褒める）／panic（焦り）。選んだ表情だけを描く
// - size：幅（px）。高さは viewBox の比で決まる
// - bob：小さく上下にゆれる（待っている場面だけで使う。動きを減らす設定のときは止まる）
// - decorative：隣に台詞などの文字があるときは true にして、読み上げから外す
import type { CSSProperties } from "react";

export type MascotExpression = "smug" | "tease" | "praise" | "panic";

const LABELS: Record<MascotExpression, string> = {
  smug: "ニヤリ",
  tease: "煽り",
  praise: "しぶしぶ褒める",
  panic: "焦り",
};

const INK = "#26215C";
const OUTLINE = "#3C3489";
const BODY = "#7F77DD";
const DARK = "#534AB7";

const brow = {
  fill: "none",
  stroke: INK,
  strokeWidth: 6.5,
  strokeLinecap: "round",
} as const;

function Eye({ cx, r = 12, rx = 14 }: { cx: number; r?: number; rx?: number }) {
  return (
    <ellipse
      cx={cx}
      cy={240}
      rx={rx}
      ry={r}
      fill="#fff"
      stroke={INK}
      strokeWidth={1.5}
    />
  );
}

// まぶた（半分閉じた目）
function Lids({ y }: { y: number }) {
  return (
    <>
      <path d={`M219 ${y} A15 12 0 0 1 249 ${y} Z`} fill={BODY} />
      <path d={`M275 ${y} A15 12 0 0 1 305 ${y} Z`} fill={BODY} />
      <path
        d={`M220 ${y} H248 M276 ${y} H304`}
        stroke={INK}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </>
  );
}

function Face({ expression }: { expression: MascotExpression }) {
  if (expression === "tease") {
    return (
      <>
        <path
          d="M221 244 Q234 232 247 244 M277 244 Q290 232 303 244"
          fill="none"
          stroke={INK}
          strokeWidth={2.8}
          strokeLinecap="round"
        />
        <path
          d="M218 218 Q234 208 250 216 M274 216 Q290 208 306 218"
          {...brow}
        />
        <path d="M244 262 Q264 290 284 262 Z" fill={INK} />
        <path d="M256 276 Q264 284 272 276 Z" fill="#ED93B1" />
        <path d="M250 263 L254 270 L258 263 Z" fill="#fff" />
      </>
    );
  }
  if (expression === "praise") {
    return (
      <>
        <Eye cx={234} />
        <Eye cx={290} />
        <circle cx={243} cy={238} r={5} fill={INK} />
        <circle cx={299} cy={238} r={5} fill={INK} />
        <Lids y={242} />
        <path d="M218 223 L248 215 M276 215 L306 223" {...brow} />
        <path
          d="M248 272 Q255 266 262 272 Q269 278 276 272"
          fill="none"
          stroke={INK}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <ellipse
          cx={212}
          cy={260}
          rx={12}
          ry={6}
          fill="#D4537E"
          opacity={0.55}
        />
        <ellipse
          cx={312}
          cy={260}
          rx={12}
          ry={6}
          fill="#D4537E"
          opacity={0.55}
        />
      </>
    );
  }
  if (expression === "panic") {
    return (
      <>
        <Eye cx={234} r={15} rx={15} />
        <Eye cx={290} r={15} rx={15} />
        <circle cx={234} cy={240} r={3} fill={INK} />
        <circle cx={290} cy={240} r={3} fill={INK} />
        <path d="M218 212 L248 219 M276 219 L306 212" {...brow} />
        <ellipse cx={262} cy={278} rx={9} ry={11} fill={INK} />
        <path
          d="M328 202 Q338 218 328 224 Q318 218 328 202 Z"
          fill="#B5D4F4"
          stroke="#185FA5"
          strokeWidth={1}
        />
      </>
    );
  }
  return (
    <>
      <Eye cx={234} />
      <Eye cx={290} />
      <circle cx={240} cy={245} r={5} fill={INK} />
      <circle cx={296} cy={245} r={5} fill={INK} />
      <Lids y={240} />
      <path d="M216 219 Q233 205 251 217" {...brow} />
      <path d="M275 225 L305 217" {...brow} />
      <path
        d="M246 268 Q264 278 282 262"
        fill="none"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <path
        d="M263 272 L267 281 L271 271 Z"
        fill="#fff"
        stroke={INK}
        strokeWidth={1}
      />
    </>
  );
}

const bobCss =
  "@keyframes mascot-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}" +
  ".mascot-bob{animation:mascot-bob 2.6s ease-in-out infinite}" +
  "@media (prefers-reduced-motion:reduce){.mascot-bob{animation:none}}";

export function Mascot({
  expression = "smug",
  size = 96,
  bob = false,
  decorative = false,
  className = "",
}: {
  expression?: MascotExpression;
  size?: number;
  bob?: boolean;
  decorative?: boolean;
  className?: string;
}) {
  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({
        role: "img",
        "aria-label": `TOUKOU のキャラクター（${LABELS[expression]}）`,
      } as const);
  const style: CSSProperties = { width: size, height: "auto" };
  return (
    <>
      {bob && (
        <style href="mascot-bob" precedence="default">
          {bobCss}
        </style>
      )}
      <svg
        viewBox="130 154 240 200"
        style={style}
        className={`shrink-0 ${bob ? "mascot-bob" : ""} ${className}`}
        {...a11y}
      >
        <ellipse
          cx={262}
          cy={342}
          rx={86}
          ry={8}
          fill="#888780"
          opacity={0.2}
        />
        <path
          d="M176 306 Q138 308 142 280 Q146 262 162 272"
          fill="none"
          stroke={DARK}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <path d="M158 262 L170 272 L156 278 Z" fill={DARK} />
        <path
          d="M208 198 Q194 158 230 184 Z"
          fill={DARK}
          stroke={OUTLINE}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <path
          d="M314 198 Q328 158 292 184 Z"
          fill={DARK}
          stroke={OUTLINE}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <ellipse cx={228} cy={334} rx={19} ry={8} fill={DARK} />
        <ellipse cx={296} cy={334} rx={19} ry={8} fill={DARK} />
        <path
          d="M192 332 C170 332 168 300 172 270 C176 218 204 180 262 180 C320 180 348 218 352 270 C356 300 354 332 332 332 Z"
          fill={BODY}
          stroke={OUTLINE}
          strokeWidth={2}
        />
        <ellipse cx={262} cy={300} rx={50} ry={26} fill="#AFA9EC" />
        <ellipse
          cx={180}
          cy={268}
          rx={9}
          ry={16}
          fill={BODY}
          stroke={OUTLINE}
          strokeWidth={1.5}
          transform="rotate(28 180 268)"
        />
        <rect
          x={350}
          y={232}
          width={9}
          height={28}
          rx={2}
          fill="#F1EFE8"
          stroke="#888780"
          strokeWidth={1}
          transform="rotate(22 354 246)"
        />
        <ellipse
          cx={346}
          cy={262}
          rx={9}
          ry={16}
          fill={BODY}
          stroke={OUTLINE}
          strokeWidth={1.5}
          transform="rotate(-32 346 262)"
        />
        <ellipse
          cx={212}
          cy={260}
          rx={10}
          ry={5}
          fill="#ED93B1"
          opacity={0.6}
        />
        <ellipse
          cx={312}
          cy={260}
          rx={10}
          ry={5}
          fill="#ED93B1"
          opacity={0.6}
        />
        <Face expression={expression} />
      </svg>
    </>
  );
}
