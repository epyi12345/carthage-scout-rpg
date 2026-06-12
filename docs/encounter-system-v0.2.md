# Encounter System v0.2

이번 문서는 튜토리얼 프로토타입 이후 본편 인카운터를 확장하기 위한 데이터 구조 기준이다. 목표는 전체 28일 캠페인을 구현하는 것이 아니라, 장기 탐사형/거점형/연계형/불가사의/성장형 인카운터를 같은 엔진으로 표현할 수 있게 만드는 것이다.

## 새 인카운터 카테고리

`EncounterCategory`는 다음 값을 가진다.

| 카테고리 | 의미 |
| --- | --- |
| `main_story` | 메인 진행 |
| `survival` | 체력/체온/식량 압박 |
| `map_info` | 지도 정보 |
| `terrain` | 절벽/계곡/길목 |
| `highground` | 고지대 관측 |
| `camp` | 야영/밤 |
| `search` | 수색/자원 |
| `tribe_diplomacy` | 부족/마을 관계 |
| `roman_enemy` | 로마군/적 |
| `sanity` | 정신력/SAN |
| `item_specific` | 특정 아이템 전용 |
| `return` | 복귀 전용 |
| `mystic` | 불가사의/판타지 |
| `long_exploration` | 깊은 동굴 같은 장기 탐사 |
| `safe_point` | 얕은 동굴 같은 거점 |
| `chain` | 생존자 흔적 추적 같은 연계형 |
| `village_request` | 마을 의뢰 |
| `growth` | 능력치/특성 증가 |

## 발생 방식 타입

`EncounterOccurrenceType`은 다음 값을 가진다.

| 타입 | 의미 |
| --- | --- |
| `fixed` | 고정 스토리 |
| `location_based` | 특정 위치 진입 시 발생 |
| `conditional` | 상태/아이템/플래그 조건 |
| `random` | 랜덤 발생 |
| `chain` | 이전 선택으로 이어지는 체인 |
| `revisit` | 발견한 거점 재방문 |

## 데이터 구조 핵심

인카운터는 `category`, `occurrenceType`, `tone`, `duration`, `conditions`, `followUps`, `mapEffects`, `returnEffects`, `endingEffects`를 가질 수 있다. 선택지는 `effects`, `conditions`, `nextEncounterId`를 통해 상태 변화와 다음 인카운터를 분리한다.

효과는 생존 자원, 아이템 추가/제거, 플래그 추가/제거, 위치/지도/튜토리얼 상태 변경, 펜던트 소모/변환, 특성, 상태이상, 관계, 지도 타일 기록, 체인 상태를 표현한다.

## 깊은 동굴과 얕은 동굴의 차이

- 깊은 동굴(`long_exploration`)은 하루 또는 여러 슬롯을 쓰는 장기 탐사다. 생존 자원과 정신력을 크게 흔들고, 내부 단계나 불가사의 인카운터로 이어질 수 있다.
- 얕은 동굴(`safe_point`)은 복귀 중 안전 거점 후보가 되는 장소다. 휴식, 체온 회복, 표식 남기기 같은 선택으로 생존과 복귀 위험에 영향을 준다.

## 판타지 요소 설계 원칙

카르타고는 정통 판타지 RPG가 아니다. 불가사의 요소는 명확한 마법 설명보다 다음 톤을 따른다.

> 정말 있었던 일인지, 죽기 직전의 환각인지, 오래된 산악 민담인지 알 수 없는 사건

따라서 `mystic` 인카운터는 강력한 보상을 줄 수 있지만 정신력, 펜던트 보존, 플래그, 엔딩 점수 같은 대가를 남겨야 한다.

## 펜던트 특수 사용

펜던트는 튜토리얼에서 확정 획득하는 유품이며 다음 용도를 가진다.

- 미끼
- 거래품
- 우호 증표
- 전용 인카운터 조건
- 깊은 샘에 던져 특수 아이템 획득
- 끝까지 보존하면 업적

`consumePendant` 또는 `transformPendantInto` 효과가 실행되면 `pendant`가 인벤토리에서 제거되고 `hasConsumedPendant`가 `true`가 된다. `transformPendantInto: "black_water_pendant"`는 기존 펜던트를 제거한 뒤 `black_water_pendant`를 지급하고 `pendantTransformedInto`에 변환 결과를 기록한다.

## 연계형 인카운터 구조

연계형 인카운터는 `category: "chain"`, `occurrenceType: "chain"`, `followUps`, `addChainState`를 사용한다. 예를 들어 생존자의 흔적을 따라가면 `survivor_trace` 체인의 단계가 올라가고, 추후 `ENC_CHAIN_SURVIVOR_TRACE_002_PLACEHOLDER` 같은 후속 인카운터로 이어진다.

## 샘플 인카운터 목록

| ID | 역할 |
| --- | --- |
| `ENC_CAVE_DEEP_001` | 깊은 동굴 장기 탐사 진입 샘플 |
| `ENC_CAVE_SHALLOW_001` | 얕은 동굴 안전 거점 샘플 |
| `ENC_CHAIN_SURVIVOR_TRACE_001` | 생존자 흔적 추적 체인 샘플 |
| `ENC_VILLAGE_REQUEST_001` | 마을 의뢰/관계 변화 샘플 |
| `ENC_MYSTIC_WELL_001` | 펜던트 변환과 불가사의 샘 샘플 |

## 아직 구현하지 않은 것

- 본편 전체 28일 캠페인
- 깊은 동굴 내부의 모든 단계
- 실제 엔딩 점수 계산
- 복귀 경로 시뮬레이션 전체
- 복잡한 전투 시스템
- 업적 UI와 업적 저장소
- 앱 패키징, 서버, 결제, 광고
