import type { Bearing, SpecialEncounterType, TravelEncounterType } from './mapTestTypes';

export const BEARING_LABELS: Record<Bearing, string> = {
  N: '북쪽',
  NE: '북동쪽',
  E: '동쪽',
  SE: '남동쪽',
  S: '남쪽',
  SW: '남서쪽',
  W: '서쪽',
  NW: '북서쪽',
};

export const SPECIAL_TITLES: Record<SpecialEncounterType, string[]> = {
  cave: ['검은 동굴', '눈 아래 동굴'],
  cliff: ['갈라진 절벽', '부서진 절벽길'],
  village: ['부족 마을 흔적', '연기 낮은 마을'],
  survivor: ['생존자의 흔적', '쓰러진 정찰병'],
  wild_beast: ['짐승의 영역', '큰 발자국'],
  camp_trace: ['오래된 야영 흔적', '꺼진 불자리'],
  high_ground: ['높은 관측점', '바람 부는 봉우리'],
  tree_view: ['나무 위 관측점', '키 큰 전나무'],
  roman_trace: ['로마군 흔적', '말발굽 자국'],
  roman_camp: ['로마군 집결지'],
  ravine: ['얼어붙은 협곡', '깊은 골짜기'],
  snowstorm_zone: ['눈보라 지대', '하얀 시야'],
  resource: ['남은 물자 흔적', '쓸 만한 잔해'],
  trap: ['숨은 함정', '눈 아래 빈틈'],
};

export const SPECIAL_HINTS: Record<SpecialEncounterType, string[]> = {
  cave: ['검은 바위 아래로 열린 틈을 향해 간다.', '눈이 덜 쌓인 암벽 아래를 살핀다.'],
  cliff: ['바위가 드러난 경사면을 따라간다.', '부서진 절벽 아래의 좁은 길을 살핀다.'],
  village: ['낮은 연기가 보이는 방향으로 향한다.', '나무 울타리 흔적이 이어지는 곳으로 간다.'],
  survivor: ['비틀거린 발자국이 남은 방향으로 간다.', '찢어진 천 조각이 걸린 능선을 살핀다.'],
  wild_beast: ['큰 발자국이 이어진 방향으로 향한다.', '짐승 냄새가 희미하게 남은 길을 따라간다.'],
  camp_trace: ['꺼진 불자리의 재가 흩어진 방향으로 간다.', '사람이 머문 듯한 돌무더기를 따라간다.'],
  high_ground: ['시야가 트이는 높은 능선으로 오른다.', '바람이 세게 부는 봉우리를 향한다.'],
  tree_view: ['키 큰 나무들이 모인 곳으로 향한다.', '가지가 꺾인 전나무 아래를 살핀다.'],
  roman_trace: ['말발굽 자국이 굳어 있는 방향으로 향한다.', '낯선 말뚝이 보이는 능선을 향해 간다.'],
  roman_camp: ['붉은 천 조각이 보이는 북쪽 고지를 살핀다.', '많은 발자국이 모이는 방향으로 간다.'],
  ravine: ['눈이 꺼진 긴 골을 따라간다.', '얼음이 드러난 계곡선을 살핀다.'],
  snowstorm_zone: ['시야가 흐려지는 하얀 경계로 향한다.', '바람이 몰려오는 방향을 확인한다.'],
  resource: ['흩어진 짐 꾸러미가 보이는 곳으로 간다.', '천 조각과 끈이 남은 눈길을 따라간다.'],
  trap: ['눈이 어색하게 꺼진 지대를 조심히 살핀다.', '발을 디디기 전 긴 장대로 눈을 찔러본다.'],
};

export const TRAVEL_COPY: Record<TravelEncounterType, { title: string; body: string }> = {
  snow: { title: '깊은 눈', body: '눈이 무릎 위까지 올라옵니다. 길은 있지만 속도는 줄어듭니다.' },
  wild_beast: { title: '짐승의 기척', body: '바람 사이로 낮은 울음이 섞입니다. 가까운 곳에서 무언가 움직입니다.' },
  falling_rocks: { title: '낙석', body: '위쪽에서 작은 돌이 굴러옵니다. 큰 바위가 따라올 수 있습니다.' },
  lost_path: { title: '사라진 길', body: '발자국이 눈에 덮입니다. 방금 지나온 방향도 흐릿합니다.' },
  supply_loss: { title: '물자 손실', body: '가죽끈 하나가 풀립니다. 작은 물건 몇 개가 눈 아래로 사라집니다.' },
  return_warning: { title: '복귀 위험', body: '뒤돌아보면 지나온 능선이 이미 다른 모양입니다. 돌아갈 길도 기록이 필요합니다.' },
  viewpoint: { title: '짧은 관측', body: '잠깐 시야가 트입니다. 멀리 어두운 점과 낮은 능선이 보입니다.' },
  camp_trace: { title: '야영 흔적', body: '돌로 둘러친 작은 불자리와 검은 재가 남아 있습니다.' },
};
