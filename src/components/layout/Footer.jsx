export default function Footer() {
  return (
    <footer className="hidden lg:block lg:pl-60" style={{ background: '#fff', borderTop: '1px solid #D4EDE0' }}>
      <div className="max-w-4xl mx-auto px-10 py-4 flex items-center justify-between text-xs" style={{ color: '#9CA3AF' }}>
        <span>© 2026 GardenCare — Градински дневник</span>
        <div className="flex gap-4">
          <a href="#" className="hover:opacity-70 transition-opacity">Поверителност</a>
          <a href="#" className="hover:opacity-70 transition-opacity">Условия</a>
          <a href="#" className="hover:opacity-70 transition-opacity">Контакти</a>
        </div>
      </div>
    </footer>
  )
}
