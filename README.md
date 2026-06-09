# Carthage Scout RPG MVP Foundation

카르타고 / Carthage Scout RPG는 한니발의 알프스 횡단을 위해 파견된 정찰대장이 되어, **내가 살아남을 수 있는 길이 아니라 군대가 살아남을 수 있는 길**을 기록하는 모바일 우선 텍스트 생존 탐험 RPG입니다.

이번 구현은 최종 게임이 아니라 GitHub Pages에 올릴 수 있는 정적 모바일 웹 MVP 기반입니다. 백엔드, 로그인, 멀티플레이, 결제, 복잡한 전투, 제작 시스템은 포함하지 않습니다.

## 실행 방법

```bash
npm install
npm run dev
```

프로덕션 빌드:

```bash
npm run build
npm run preview
```

런치 스플래시는 실제 저장소 자산 `public/assets/logos/logo_ref_heick_games_full.png`를 사용합니다. 메인 타이틀 인트로는 `public/assets/backgrounds/bg_main_alpine_scout_fog_intro.jpg`가 걷히며 `public/assets/backgrounds/bg_main_alpine_scout_clear.jpg`를 드러내는 구조입니다.

## GitHub Pages 배포

Vite 정적 빌드 결과물은 `dist/`에 생성됩니다. 이 저장소는 GitHub Pages 서브패스 배포를 위해 `vite.config.ts`의 `base` 값을 `/carthage-scout-rpg/`로 설정합니다.

자동 배포는 `.github/workflows/deploy-pages.yml`에서 관리합니다. `mvp` 브랜치에 push되면 워크플로가 의존성을 설치하고, 타입 체크를 실행하고, 정적 사이트를 빌드한 뒤 `dist/`를 GitHub Pages에 배포합니다.

GitHub 저장소 설정에서 필요한 항목:

1. **Settings → Pages → Build and deployment → Source**를 `GitHub Actions`로 설정합니다.
2. **Settings → Actions → General**에서 Actions 실행이 허용되어 있어야 합니다.
3. 배포 브랜치는 워크플로 기준으로 `mvp`입니다. `mvp`에 push하거나 워크플로를 수동 실행하면 Pages 배포가 진행됩니다.

로컬 확인:

```bash
npm run typecheck
npm run build
npm run preview
```

## 구현된 MVP 기능

- React + TypeScript + Vite 모바일 웹 구조
- localStorage 기반 저장/이어하기
- 시드 기반 7x7 절차적 산악 지도 생성
- 시스템 지도와 플레이어 지도 분리
  - 시스템 지도: 실제 지형, 위험도, 통과 가능 여부, 핵심 타일, 인카운터 ID 보유
  - 플레이어 지도: unknown / observed / scouted / recorded / route_connected 상태와 관측 정보만 보유
- 플레이어 행동
  - 이동
  - 인접 타일 관측
  - 관측/정찰 타일 기록
  - 휴식
  - 야영지 복귀 및 엔딩 평가
- 생존 자원
  - 체력
  - 식량
  - 체온
  - 피로
  - 일차
- JSON 기반 인카운터 엔진
- 이동 중 간단한 인카운터 발생
- 엔딩 평가 기준
  - 생존
  - 지도 정확도
  - 위험 경로 표시
  - 통과 가능 경로 발견
  - 누락된 핵심 타일
  - 복귀 시점
- 개발자 패널
  - MVP/v0.2 인카운터 바로 이동
  - 시스템 지도 표시 토글
  - 플래그/체인 상태 확인
  - 특성/아이템/상태 조작

## 주요 파일

```text
data/
  encounters/mvp.json            # MVP 이동 중 발생하는 JSON 인카운터
  encounters/samples-v0.2.json   # 확장 구조 샘플 인카운터
  items.json                     # 아이템 플레이스홀더
  traits.json                    # 특성 플레이스홀더
src/game/
  types.ts                       # GameState, MapTile, PlayerState, Encounter, Choice, Item, Ending 타입
  map.ts                         # 시드 기반 7x7 시스템/플레이어 지도 생성 및 타일 공개
  engine.ts                      # 이동/관측/기록/휴식/복귀/인카운터 효과 적용
  ending.ts                      # 엔딩 평가
  save.ts                        # localStorage 저장/로드
src/components/
  MapView.tsx                    # 모바일 그리드 지도
  DevPanel.tsx                   # 테스트 패널
src/screens/
  GameScreen.tsx                 # 플레이 가능한 세로 슬라이스
```

## Encounter System v0.2 문서

- [Encounter System v0.2](docs/encounter-system-v0.2.md): 확장형 인카운터 카테고리, 발생 방식, 펜던트 특수 사용, 샘플 인카운터 구조를 정리합니다.

## 남은 TODO

- 실제 28일 캠페인 구조
- 복귀 경로를 한 칸씩 되짚는 시스템
- route_connected를 경로 그래프로 검증하는 로직
- 지도 정확도에 지형 오기록/부분 기록 반영
- 위험 표식 UI 개선
- 고지대 관측, 야영, 부족/로마군 인카운터 추가
- GitHub Actions 기반 Pages 자동 배포 워크플로
