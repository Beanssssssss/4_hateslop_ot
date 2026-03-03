"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type RoleTab =
  | "producerAdmin"
  | "producerMember"
  | "engineerAdmin"
  | "engineerMember"
  | "alumni"
  | "summary";

type TeamId = 1 | 2 | 3 | 4 | 5;

type RoleType =
  | "프로듀서 운영진"
  | "프로듀서 부원"
  | "엔지니어 운영진"
  | "엔지니어 부원"
  | "알럼나이";

interface Assignment {
  id: string;
  name: string;
  team: TeamId;
  role: RoleType;
}

interface CardConfig {
  id: string;
  team: TeamId;
}

const TEAM_NAMES: Record<TeamId, string> = {
  1: "크루아상 서리하는 라쿤",
  2: "멍때리는 카피바라",
  3: "선글라스 낀 하프물범",
  4: "전력질주하는 거북이",
  5: "휘파람 부는 수달",
};

const TEAM_IMAGES: Record<TeamId, { src: string; alt: string }> = {
  1: { src: "/1.png", alt: "크루아상 서리하는 라쿤" },
  2: { src: "/2.png", alt: "멍때리는 카피바라" },
  3: { src: "/3.png", alt: "선글라스 낀 하프물범" },
  4: { src: "/4.png", alt: "전력질주하는 거북이" },
  5: { src: "/5.png", alt: "휘파람 부는 수달" },
};

const ASSIGNMENTS_STORAGE_KEY = "networking_assignments_v1";
const USED_CARDS_STORAGE_KEY = "networking_used_cards_v1";

function getTeamLabel(team: TeamId, withPrefix: boolean = true): string {
  const name = TEAM_NAMES[team];
  return withPrefix ? `Team ${name}` : name;
}

const producerMemberCards: CardConfig[] = Array.from({ length: 10 }).map(
  (_, index) => ({
    id: `producer-member-${index + 1}`,
    team: (((index / 2) | 0) + 1) as TeamId,
  })
);

const engineerMemberCards: CardConfig[] = Array.from({ length: 10 }).map(
  (_, index) => ({
    id: `engineer-member-${index + 1}`,
    team: (((index / 2) | 0) + 1) as TeamId,
  })
);

const producerAdminCards: CardConfig[] = Array.from({ length: 5 }).map(
  (_, index) => ({
    id: `producer-admin-${index + 1}`,
    team: (index + 1) as TeamId,
  })
);

const engineerAdminCards: CardConfig[] = Array.from({ length: 5 }).map(
  (_, index) => ({
    id: `engineer-admin-${index + 1}`,
    team: (index + 1) as TeamId,
  })
);

const alumniCards: CardConfig[] = Array.from({ length: 10 }).map(
  (_, index) => ({
    id: `alumni-${index + 1}`,
    team: (((index / 2) | 0) + 1) as TeamId,
  })
);

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type CardsTab = Exclude<RoleTab, "summary">;

type CardsState = Record<CardsTab, CardConfig[]>;

const initialCardsByTab: CardsState = {
  producerAdmin: producerAdminCards,
  producerMember: producerMemberCards,
  engineerAdmin: engineerAdminCards,
  engineerMember: engineerMemberCards,
  alumni: alumniCards,
};

function getLabelForTab(tab: RoleTab): RoleType {
  switch (tab) {
    case "producerAdmin":
      return "프로듀서 운영진";
    case "producerMember":
      return "프로듀서 부원";
    case "engineerAdmin":
      return "엔지니어 운영진";
    case "engineerMember":
      return "엔지니어 부원";
    case "alumni":
      return "알럼나이";
    default:
      return "프로듀서 부원";
  }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<RoleTab>("producerAdmin");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [usedCardIds, setUsedCardIds] = useState<Set<string>>(new Set());
  const [flippingCardId, setFlippingCardId] = useState<string | null>(null);
  const [cardsByTab, setCardsByTab] = useState<CardsState>(initialCardsByTab);
  const [showIntro, setShowIntro] = useState(true);

  const label = getLabelForTab(activeTab);

  // 초기 로드: localStorage에서 기존 배정 / 사용된 카드 복원
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedAssignments = window.localStorage.getItem(
        ASSIGNMENTS_STORAGE_KEY
      );
      const storedUsedCards = window.localStorage.getItem(
        USED_CARDS_STORAGE_KEY
      );

      if (storedAssignments) {
        const parsed = JSON.parse(storedAssignments) as Assignment[];
        if (Array.isArray(parsed)) {
          setAssignments(parsed);
        }
      }

      if (storedUsedCards) {
        const parsed = JSON.parse(storedUsedCards) as string[];
        if (Array.isArray(parsed)) {
          setUsedCardIds(new Set(parsed));
        }
      }
    } catch {
      // 저장된 값이 깨져 있으면 그냥 무시하고 새 세션으로 시작
    }
  }, []);

  useEffect(() => {
    // 클라이언트 마운트 후 각 탭 카드 한 번씩 섞기 (알럼나이 포함)
    setCardsByTab((prev) => ({
      ...prev,
      producerAdmin: shuffle(prev.producerAdmin),
      producerMember: shuffle(prev.producerMember),
      engineerAdmin: shuffle(prev.engineerAdmin),
      engineerMember: shuffle(prev.engineerMember),
      alumni: shuffle(prev.alumni),
    }));
  }, []);

  // 배정 / 사용된 카드가 바뀔 때마다 localStorage에 저장
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        ASSIGNMENTS_STORAGE_KEY,
        JSON.stringify(assignments)
      );
      window.localStorage.setItem(
        USED_CARDS_STORAGE_KEY,
        JSON.stringify(Array.from(usedCardIds))
      );
    } catch {
      // 저장 실패해도 UI는 그대로 동작하도록 무시
    }
  }, [assignments, usedCardIds]);

  const currentTabKey =
    activeTab === "summary" ? "producerMember" : (activeTab as CardsTab);
  const currentCards = cardsByTab[currentTabKey] ?? [];
  const availableCards = currentCards.filter(
    (card) => !usedCardIds.has(card.id)
  );

  const handleCardClick = (card: CardConfig) => {
    const tabKey = activeTab as CardsTab;
    setFlippingCardId(card.id);

    setTimeout(() => {
      const name = window.prompt("이름을 입력해주세요");
      if (!name || !name.trim()) {
        setFlippingCardId(null);
        return;
      }

      const roleLabel = label;

      setAssignments((prev) => [
        ...prev,
        {
          id: `${card.id}-${Date.now()}`,
          name: name.trim(),
          team: card.team,
          role: roleLabel,
        },
      ]);
      setUsedCardIds((prev) => new Set(prev).add(card.id));
      // 선택된 카드는 제거하고, 남은 카드만 다시 섞기
      setCardsByTab((prev) => {
        const original = prev[tabKey] ?? [];
        const remaining = original.filter((c) => c.id !== card.id);
        return {
          ...prev,
          [tabKey]: shuffle(remaining),
        };
      });
      setFlippingCardId(null);
    }, 400);
  };

  const tabs: { id: RoleTab; label: string }[] = [
    { id: "producerAdmin", label: "프로듀서 운영진" },
    { id: "producerMember", label: "프로듀서 부원" },
    { id: "engineerAdmin", label: "엔지니어 운영진" },
    { id: "engineerMember", label: "엔지니어 부원" },
    { id: "alumni", label: "알럼나이" },
    { id: "summary", label: "종합" },
  ];

  const renderCards = () => {
    if (activeTab === "summary") return null;

    if (availableCards.length === 0) {
      return (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 text-sm text-zinc-500">
          모든 카드를 사용했습니다. 다른 탭을 선택하거나 종합 탭에서 결과를 확인해주세요.
        </div>
      );
    }

    return (
      <div className="grid w-full gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {availableCards.map((card) => {
          const teamLabel = getTeamLabel(card.team, false);
          const isFlipping = flippingCardId === card.id;

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              className="group card-3d relative h-56 w-full cursor-pointer rounded-2xl border border-zinc-800/80 bg-transparent text-white shadow-[0_18px_45px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.8)]"
            >
              <div className={`card-inner ${isFlipping ? "is-flipped" : ""}`}>
                <div
                  className="card-face back"
                  style={{ backgroundImage: 'url("/card.svg")' }}
                >
                  <div className="flex h-full items-end justify-between px-3 pb-2 text-[10px] text-zinc-200/80">
                    <span className="uppercase tracking-[0.2em]">
                      Hateslop
                    </span>
                    <span className="rounded-full bg-black/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]">
                      Networking
                    </span>
                  </div>
                </div>
                <div className="card-face front bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-4">
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] font-medium tracking-wide text-zinc-300">
                      <span>{label}</span>
                      <span className="rounded-full border border-zinc-600/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-300">
                        Team
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-zinc-600/80 bg-zinc-900/80 shadow-md">
                        <Image
                          src={TEAM_IMAGES[card.team].src}
                          alt={TEAM_IMAGES[card.team].alt}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <span className="px-3 text-center text-lg font-semibold leading-snug text-zinc-50">
                        {teamLabel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>이 카드를 선택했습니다</span>
                      <span className="text-zinc-500">이름 입력 창 표시</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderSummaryTable = () => {
    const teams: TeamId[] = [1, 2, 3, 4, 5];

    const rows: { [K in TeamId]: Assignment[] } = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };

    assignments.forEach((assignment) => {
      rows[assignment.team].push(assignment);
    });

    const maxRowLength = Math.max(
      ...teams.map((team) => rows[team].length),
      1
    );

    return (
      <div className="w-full overflow-x-auto rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm backdrop-blur">
        <table className="min-w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr>
              {teams.map((team) => (
                <th
                  key={team}
                  className="rounded-lg bg-zinc-900/95 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200"
                >
                  {getTeamLabel(team)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRowLength }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {teams.map((team) => {
                  const item = rows[team][rowIndex];
                  return (
                    <td
                      key={team}
                      className="rounded-xl bg-zinc-50/90 px-4 py-2 align-top text-center text-xs text-zinc-800 shadow-[0_1px_0_rgba(15,23,42,0.06)]"
                    >
                      {item ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-semibold text-zinc-900">
                            {item.name}
                          </span>
                          <span className="rounded-full bg-zinc-900/90 px-2 py-0.5 text-[10px] font-medium text-zinc-100">
                            {item.role}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-300">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900 text-zinc-50">
      {showIntro ? (
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800/70 bg-zinc-900/60 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur-xl">
            <div className="relative h-40 w-full overflow-hidden sm:h-52 md:h-60">
              <Image
                src="/hateslop_banner.png"
                alt="Hateslop Networking"
                fill
                priority
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-zinc-950/0" />
            </div>

            <div className="relative z-10 px-6 pb-8 pt-5 sm:px-8 sm:pb-10 sm:pt-6">
              <div className="flex flex-col justify-between gap-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
                    Hateslop Networking
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                    오늘의 팀 라인업
                  </h1>
                  <p className="mt-2 text-xs text-zinc-400 sm:text-sm">
                    각 팀의 캐릭터와 분위기를 먼저 보고, 다음 단계에서 실제 배정 대시보드로 이동합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((team) => (
              <div
                key={team}
                className="relative h-52 overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/60 shadow-[0_18px_45px_rgba(0,0,0,0.7)]"
              >
                <Image
                  src={TEAM_IMAGES[team as TeamId].src}
                  alt={TEAM_IMAGES[team as TeamId].alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-4 flex flex-col items-center px-4 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-300">
                    Team {team}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-zinc-50">
                    {TEAM_NAMES[team as TeamId]}
                  </h2>
                </div>
              </div>
            ))}
          </section>

          <div className="mt-10 flex justify-end">
            <button
              onClick={() => setShowIntro(false)}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-6 py-2.5 text-xs font-semibold text-zinc-950 shadow-[0_12px_35px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-0.5 hover:bg-zinc-200"
            >
              다음으로
              <span className="text-[10px] tracking-[0.24em] uppercase">
                Go to Dashboard
              </span>
            </button>
          </div>
        </main>
      ) : (
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800/70 bg-zinc-900/60 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur-xl">
            <div className="relative h-40 w-full overflow-hidden sm:h-52 md:h-60">
              <Image
                src="/hateslop_banner.png"
                alt="Hateslop Networking"
                fill
                priority
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-zinc-950/0" />
            </div>

            <div className="relative z-10 px-6 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
                    Hateslop Networking
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                    팀 배정 대시보드
                  </h1>
                  <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                    프로듀서 / 엔지니어 운영진·부원, 알럼나이 팀을 실시간으로 배정하고 종합 탭에서 한눈에 확인하세요.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-1.5 rounded-full bg-zinc-900/60 p-1.5 text-xs text-zinc-400 ring-1 ring-zinc-800/80">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative rounded-full px-4 py-1.5 text-[11px] font-medium transition-all ${
                        isActive
                          ? "bg-zinc-50 text-zinc-950 shadow-[0_8px_30px_rgba(0,0,0,0.65)]"
                          : "text-zinc-400 hover:bg-zinc-800/80"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <section className="mt-8 flex-1 space-y-4">
            {activeTab !== "summary" && (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-zinc-500">
                    {label}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    카드를 클릭해 이름을 입력하면 해당 팀과 역할로 종합 표에 자동으로 추가됩니다.
                  </p>
                </div>
                <div className="text-right text-[11px] text-zinc-500">
                  <p>
                    남은 카드{" "}
                    <span className="font-semibold text-zinc-200">
                      {availableCards.length}
                    </span>
                    개
                  </p>
                </div>
              </div>
            )}

            {activeTab === "summary" ? renderSummaryTable() : renderCards()}
          </section>
        </main>
      )}
    </div>
  );
}
