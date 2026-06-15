interface Props { onState: () => void; onMap: () => void; onTitle: () => void }

export function TutorialCompleteScreen({ onState, onMap, onTitle }: Props) {
  return (
    <section className="panel end-panel">
      <h1>튜토리얼 완료</h1>
      <p>당신은 눈사태의 잔해를 벗어났다.</p>
      <p>품 안에는 찢어진 지도와 피 묻은 펜던트가 있다.<br />이제부터 당신이 보는 것과,<br />당신이 지도에 남기는 것은 서로 다른 의미를 가진다.</p>
      <p>한니발에게 필요한 것은<br />당신이 살아남은 길이 아니라,<br />군대가 살아남을 수 있는 길이다.</p>
      <div className="choices"><button onClick={onState}>현재 상태 보기</button><button onClick={onMap}>지도 보기</button><button onClick={onTitle}>처음으로 돌아가기</button></div>
    </section>
  );
}
