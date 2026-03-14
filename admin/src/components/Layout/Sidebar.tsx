import { Home, LayoutGrid, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const menuItems = [
  { id: "tasks", labelKey: "nav.tasks", icon: LayoutGrid },
  { id: "representatives", labelKey: "nav.representatives", icon: Users },
  { id: "settings", labelKey: "nav.settings", icon: Settings },
];

const SidebarContent = ({ activeItem, onItemClick }: { activeItem: string; onItemClick: (item: string) => void }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="p-6 flex items-center justify-between border-b border-border">
        <h2 className="text-lg font-semibold">{t("common.logo")}</h2>
      </div>

      <div className="px-4 pt-6">
        <button
          onClick={() => onItemClick("home")}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg h-12 text-base font-medium transition-colors",
            activeItem === "home"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
          )}
        >
          <Home className="w-5 h-5" />
          <span>{t("nav.home")}</span>
        </button>
      </div>

      <nav className="px-4 pt-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                activeItem === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export const Sidebar = ({ activeItem, onItemClick, open, onOpenChange }: SidebarProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-72 p-0 bg-background border-l border-border">
          <div className="flex flex-col h-full bg-background">
            <SidebarContent activeItem={activeItem} onItemClick={(item) => {
              onItemClick(item);
              onOpenChange?.(false);
            }} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden lg:flex w-64 bg-background border-l border-border h-screen fixed right-0 top-0 flex-col z-30">
      <SidebarContent activeItem={activeItem} onItemClick={onItemClick} />
    </aside>
  );
};
