import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { supportedLngs, type Locale } from "@/i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const setLang = (lng: Locale) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0" title={t("common.language")}>
          <Languages className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLang("en")}>
          English {i18n.language === "en" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLang("ar")}>
          العربية {i18n.language === "ar" && "✓"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
