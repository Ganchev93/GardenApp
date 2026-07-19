import { House, BookOpen, Sprout, CalendarDays, Camera, MessageCircle, NotebookPen } from 'lucide-react'

export const tabs = [
  { to: '/', label: 'Начало', Icon: House },
  { to: '/plants', label: 'Растения', Icon: BookOpen },
  { to: '/garden', label: 'Градина', Icon: Sprout },
  { to: '/journal', label: 'Дневник', Icon: NotebookPen },
  { to: '/calendar', label: 'Календар', Icon: CalendarDays },
  { to: '/analyze', label: 'Анализ', Icon: Camera },
  { to: '/chat', label: 'Агроном', Icon: MessageCircle },
]

// Mobile: 7 tabs are too tight — Plants is reachable from Home quick links
export const mobileTabs = tabs.filter(t => t.to !== '/plants')
