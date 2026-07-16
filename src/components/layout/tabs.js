import { House, BookOpen, Sprout, CalendarDays, Camera, MessageCircle } from 'lucide-react'

export const tabs = [
  { to: '/', label: 'Начало', Icon: House },
  { to: '/plants', label: 'Растения', Icon: BookOpen },
  { to: '/garden', label: 'Градина', Icon: Sprout },
  { to: '/calendar', label: 'Календар', Icon: CalendarDays },
  { to: '/analyze', label: 'Анализ', Icon: Camera },
  { to: '/chat', label: 'Агроном', Icon: MessageCircle },
]
