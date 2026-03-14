import { Button } from "@/components/ui/button";
import { Home, Menu, ChevronLeft, LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { clearToken } from "@/lib/api";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeaderProps {
  onMenuClick?: () => void;
  breadcrumbs?: Breadcrumb[];
  showHomeButton?: boolean;
}

const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

export const Header = ({ onMenuClick, breadcrumbs, showHomeButton = true }: HeaderProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const now = new Date();
  const dayName = t(`days.${dayKeys[now.getDay()]}`);
  const monthName = t(`months.${monthKeys[now.getMonth()]}`);
  const day = now.getDate();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  return (
    <header className="bg-card border-b border-border py-3 sm:py-4 px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-2 sm:gap-4">
          {isMobile && onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}

          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  )}
                  {crumb.href ? (
                    <button
                      onClick={() => navigate(crumb.href!)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
          ) : showHomeButton ? (
            <Button
              variant="default"
              className="gap-2 hidden sm:flex"
              onClick={() => navigate("/dashboard")}
            >
              <Home className="w-4 h-4" />
              {t("common.home")}
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground text-left">
            {dayName} {day} {monthName} - {hours}:{minutes} - {t("header.riyadh")}
          </span>
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => {
              clearToken();
              navigate("/");
            }}
            title={t("common.logout")}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
