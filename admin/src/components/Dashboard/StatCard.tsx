import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
}

export const StatCard = ({ title, value, icon }: StatCardProps) => {
  return (
    <Card className="p-4 sm:p-6 flex flex-col">
      <div className="flex justify-center mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center">
          {icon || <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />}
        </div>
      </div>
      <div className="space-y-1 sm:space-y-2 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
        <p className="text-xl sm:text-2xl font-bold break-words">{value}</p>
      </div>
    </Card>
  );
};
