import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path?: string;
  onClick?: () => void;
}

interface NavigationProps {
  items: NavItem[];
}

export const Navigation = ({ items }: NavigationProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="shrink-0">
            <h1 className="text-2xl font-bold text-primary">LeGuardian</h1>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {items.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (item.path) navigate(item.path);
                  if (item.onClick) item.onClick();
                }}
                className="gap-2"
              >
                <span className="w-5 h-5">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Button>
            ))}

            {/* User Menu */}
            <div className="flex items-center gap-4 pl-4 border-l border-border">
              <span className="text-sm text-muted-foreground">
                {user?.name}
              </span>
              <Button variant="destructive" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-2">
              {items.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (item.path) navigate(item.path);
                    if (item.onClick) item.onClick();
                    setIsMenuOpen(false);
                  }}
                  className="justify-start gap-2"
                >
                  <span className="w-5 h-5">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Button>
              ))}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="justify-start gap-2 mt-2 border-t border-border pt-2"
              >
                Logout
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
