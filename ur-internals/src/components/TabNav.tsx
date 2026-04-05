import { NavLink } from 'react-router-dom'

interface TabNavItem {
  key: string
  label: string
  to: string
}

interface TabNavProps {
  label: string
  items: TabNavItem[]
}

export function TabNav({ label, items }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label={label}>
      {items.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          end
          className={({ isActive }) =>
            isActive ? 'tab-nav__link tab-nav__link--active' : 'tab-nav__link'
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
