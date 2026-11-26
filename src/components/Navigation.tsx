
import {
  House,
  Layers,
  BookOpen,
  ChartNoAxesColumn
} from 'lucide-react';

import type { Page } from '../types';

interface Props {
  page: Page;
  onNavigate: (page: Page) => void;
}

const items = [
  { id: 'home', label: 'Главная', icon: House },
  { id: 'learn', label: 'Учить', icon: Layers },
  { id: 'dictionary', label: 'Словарь', icon: BookOpen },
  { id: 'stats', label: 'Прогресс', icon: ChartNoAxesColumn }
] as const;

export default function Navigation({
  page,
  onNavigate
}: Props) {
  return (
    <nav className="bottom-nav">
      {items.map(item => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            aria-current={page === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <Icon size={23} strokeWidth={1.8} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
