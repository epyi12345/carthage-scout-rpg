import type { TabId } from '../game/types';

interface Props { activeTab: TabId; onTabChange: (tab: TabId) => void; mapUnlocked: boolean }

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'story', label: '이야기' },
  { id: 'map', label: '지도' },
  { id: 'inventory', label: '인벤토리' },
  { id: 'dev', label: '개발자' },
];

export function BottomNav({ activeTab, onTabChange, mapUnlocked }: Props) {
  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => <button className={activeTab === tab.id ? 'active' : ''} key={tab.id} onClick={() => onTabChange(tab.id)}>{tab.label}{tab.id === 'map' && !mapUnlocked ? ' 🔒' : ''}</button>)}
    </nav>
  );
}
