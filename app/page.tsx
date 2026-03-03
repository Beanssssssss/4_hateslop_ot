"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type RoleTab = "producerMember" | "engineerMember" | "alumni" | "summary";

type TeamId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

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
  6: "통나무 스시 마스터 비버",
  7: "셀카 찍는 미어캣",
  8: "외줄타는 판다",
};

const TEAM_IMAGES: Record<TeamId, { src: string; alt: string }> = {
  1: { src: "/team1.png", alt: "크루아상 서리하는 라쿤" },
  2: { src: "/team2.png", alt: "멍때리는 카피바라" },
  3: { src: "/team3.png", alt: "선글라스 낀 하프물범" },
  4: { src: "/team4.png", alt: "전력질주하는 거북이" },
  5: { src: "/team5.png", alt: "휘파람 부는 수달" },
  6: { src: "/team6.png", alt: "통나무 스시 마스터 비버" },
  7: { src: "/team7.png", alt: "셀카 찍는 미어캣" },
  8: { src: "/team8.png", alt: "외줄타는 판다" },
};

const PD_ADMINS = ["정나림", "권세빈", "홍서원"];
const ENG_ADMINS = ["구종빈", "민경호", "이홍겸", "박지민", "김윤진"];

function getTeamLabel(team: TeamId, withPrefix: boolean = true): string {
  const name = TEAM_NAMES[team];
  return withPrefix ? `Team ${name}` : name;
}

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

const STATE_STORAGE_KEY = "networking_state_v1";

function getLabelForTab(tab: RoleTab): RoleType {
  switch (tab) {
    case "producerMember":
      return "프로듀서 부원";
    case "engineerMember":
      return "엔지니어 부원";
    case "alumni":
      return "알럼나이";
    default:
      return "프로듀서 부원";
  }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<RoleTab>("producerMember");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [usedCardIds, setUsedCardIds] = useState<Set<string>>(new Set());
  const [flippingCardId, setFlippingCardId] = useState<string | null>(null);
  const [cardsByTab, setCardsByTab] = useState<CardsState>({
    producerMember: [],
    engineerMember: [],
    alumni: [],
  });
  const [showIntro, setShowIntro] = useState(true);
  const [showAdminReveal, setShowAdminReveal] = useState(false);
  const [adminRevealIndex, setAdminRevealIndex] = useState(0);

  const label = getLabelForTab(activeTab);
  // 새로고침 시 현재 상태 복원 (동일 탭 내)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(STATE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        activeTab: RoleTab;
        assignments: Assignment[];
        usedCardIds: string[];
        cardsByTab: CardsState;
        showIntro: boolean;
        showAdminReveal: boolean;
        adminRevealIndex: number;
      };
      setActiveTab(parsed.activeTab ?? "producerMember");
      setAssignments(Array.isArray(parsed.assignments) ? parsed.assignments : []);
      setUsedCardIds(new Set(parsed.usedCardIds ?? []));
      setCardsByTab({
        producerMember: parsed.cardsByTab?.producerMember ?? [],
        engineerMember: parsed.cardsByTab?.engineerMember ?? [],
        alumni: parsed.cardsByTab?.alumni ?? [],
      });
      setShowIntro(parsed.showIntro ?? false);
      setShowAdminReveal(parsed.showAdminReveal ?? false);
      setAdminRevealIndex(parsed.adminRevealIndex ?? 0);
    } catch {
      // 저장 포맷이 깨져 있으면 무시하고 새 세션으로 시작
    }
  }, []);

  // 상태 변경 시 세션 스토리지에 저장 (동일 탭 새로고침에만 영향)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload = JSON.stringify({
        activeTab,
        assignments,
        usedCardIds: Array.from(usedCardIds),
        cardsByTab,
        showIntro,
        showAdminReveal,
        adminRevealIndex,
      });
      window.sessionStorage.setItem(STATE_STORAGE_KEY, payload);
    } catch {
      // ignore
    }
  }, [
    activeTab,
    assignments,
    usedCardIds,
    cardsByTab,
    showIntro,
    showAdminReveal,
    adminRevealIndex,
  ]);

  const handleStartDashboard = () => {
    // 새 라운드 시작 시 기존 상태 초기화
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(STATE_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    // 1) 운영진 8명을 8팀에 랜덤 배치 (각 팀 1명씩)
    const teams: TeamId[] = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffledTeams = shuffle(teams);
    const pdTeams = shuffledTeams.slice(0, 3);
    const engTeams = shuffledTeams.slice(3, 8);

    const adminAssignments: Assignment[] = [
      ...PD_ADMINS.map((name, idx) => ({
        id: `pd-admin-${idx + 1}`,
        name,
        team: pdTeams[idx],
        role: "프로듀서 운영진" as RoleType,
      })),
      ...ENG_ADMINS.map((name, idx) => ({
        id: `eng-admin-${idx + 1}`,
        name,
        team: engTeams[idx],
        role: "엔지니어 운영진" as RoleType,
      })),
    ];

    // 2) 부원/알럼나이 카드 분배
    // 기본: 각 팀마다 피디 부원 1, 엔지니어 부원 1, 알럼나이 1
    const baseProducerMemberCards: CardConfig[] = teams.map((team, idx) => ({
      id: `producer-member-base-${idx + 1}`,
      team,
    }));
    const baseEngineerMemberCards: CardConfig[] = teams.map((team, idx) => ({
      id: `engineer-member-base-${idx + 1}`,
      team,
    }));
    const baseAlumniCards: CardConfig[] = teams.map((team, idx) => ({
      id: `alumni-base-${idx + 1}`,
      team,
    }));

    // 추가: 2 피디 부원, 2 엔지니어 부원, 3 알럼나이 → 총 7장
    const extraTeams = shuffle(teams).slice(0, 7);
    const extraProducerTeams = extraTeams.slice(0, 2);
    const extraEngineerTeams = extraTeams.slice(2, 4);
    const extraAlumniTeams = extraTeams.slice(4, 7);

    const extraProducerMemberCards: CardConfig[] = extraProducerTeams.map(
      (team, idx) => ({
        id: `producer-member-extra-${idx + 1}`,
        team,
      })
    );
    const extraEngineerMemberCards: CardConfig[] = extraEngineerTeams.map(
      (team, idx) => ({
        id: `engineer-member-extra-${idx + 1}`,
        team,
      })
    );
    const extraAlumniCards: CardConfig[] = extraAlumniTeams.map(
      (team, idx) => ({
        id: `alumni-extra-${idx + 1}`,
        team,
      })
    );

    setAssignments(adminAssignments);
    setUsedCardIds(new Set());
    setCardsByTab({
      producerMember: shuffle([
        ...baseProducerMemberCards,
        ...extraProducerMemberCards,
      ]),
      engineerMember: shuffle([
        ...baseEngineerMemberCards,
        ...extraEngineerMemberCards,
      ]),
      alumni: shuffle([...baseAlumniCards, ...extraAlumniCards]),
    });
    setActiveTab("producerMember");
    setShowIntro(false);
    setAdminRevealIndex(0);
    setShowAdminReveal(true);
  };

  // 운영진 매핑 카드 애니메이션: 1팀씩 순차적으로 등장
  useEffect(() => {
    if (!showAdminReveal) return;
    setAdminRevealIndex(0);
    const maxIndex = 7; // 0~7 → 8팀
    const interval = window.setInterval(() => {
      setAdminRevealIndex((prev) => {
        if (prev >= maxIndex) {
          window.clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => window.clearInterval(interval);
  }, [showAdminReveal]);

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
    { id: "producerMember", label: "프로듀서 부원" },
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
                <div className="card-face back">
                  <Image
                    src="/card.png"
                    alt="Card back"
                    fill
                    sizes="(min-width: 1024px) 12rem, (min-width: 768px) 16rem, 100vw"
                    className="object-cover"
                    priority
                  />
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
    const teams: TeamId[] = [1, 2, 3, 4, 5, 6, 7, 8];

    const rows: { [K in TeamId]: Assignment[] } = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
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
                          <span className="text-sm font-semibold text-zinc-900 whitespace-nowrap">
                            {item.name}
                          </span>
                          <span className="rounded-full bg-zinc-900/90 px-2 py-0.5 text-[10px] font-medium text-zinc-100 whitespace-nowrap">
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
            {[1, 2, 3, 4, 5, 6, 7, 8].map((team) => (
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
              onClick={handleStartDashboard}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-6 py-2.5 text-xs font-semibold text-zinc-950 shadow-[0_12px_35px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-0.5 hover:bg-zinc-200"
            >
              다음으로
              <span className="text-[10px] tracking-[0.24em] uppercase">
                Go to Dashboard
              </span>
            </button>
          </div>
        </main>
      ) : showAdminReveal ? (
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
                    Hateslop Networking
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                    운영진 팀 매핑 결과
                  </h1>
                  <p className="mt-2 text-xs text-zinc-400 sm:text-sm">
                    프로듀서·엔지니어 운영진 8명이 각 팀에 한 명씩 자동으로 배정되었습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((team, idx) => {
              const admin = assignments.find(
                (a) =>
                  (a.role === "프로듀서 운영진" ||
                    a.role === "엔지니어 운영진") &&
                  a.team === team
              );
              return (
                <div
                  key={team}
                  className={`relative h-56 overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-900/60 shadow-[0_18px_45px_rgba(0,0,0,0.7)] transition-all duration-500 ${
                    idx <= adminRevealIndex
                      ? "opacity-100 translate-y-0"
                      : "pointer-events-none opacity-0 translate-y-4"
                  }`}
                >
                  <Image
                    src={TEAM_IMAGES[team as TeamId].src}
                    alt={TEAM_IMAGES[team as TeamId].alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-3 flex flex-col items-center px-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-300">
                      Team {team}
                    </p>
                    <h2 className="mt-1 text-sm font-semibold text-zinc-50">
                      {TEAM_NAMES[team as TeamId]}
                    </h2>
                    {admin && (
                      <div className="mt-2 flex flex-col items-center gap-1">
                        <span className="rounded-full bg-zinc-950/80 px-2 py-0.5 text-[10px] font-medium text-zinc-100">
                          {admin.role}
                        </span>
                        <span className="text-xs font-semibold text-zinc-50">
                          {admin.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          <div className="mt-10 flex justify-end">
            <button
              onClick={() => {
                setShowAdminReveal(false);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-6 py-2.5 text-xs font-semibold text-zinc-950 shadow-[0_12px_35px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-0.5 hover:bg-zinc-200"
            >
              카드 뽑기 시작
              <span className="text-[10px] tracking-[0.24em] uppercase">
                Go to Cards
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
