import { Link } from "react-router-dom"
import { ThemeToggle } from "./theme-toggle"
import { UserNav } from "./user-nav"

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold text-primary">FairTab</span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium">
              Dashboard
            </Link>
            <Link to="/groups" className="text-sm font-medium">
              Groups
            </Link>
            <Link to="/friends" className="text-sm font-medium">
              Friends
            </Link>
            <Link to="/activity" className="text-sm font-medium">
              Activity
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  )
}

