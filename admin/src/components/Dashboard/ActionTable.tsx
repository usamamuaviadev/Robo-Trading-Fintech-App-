import { Badge } from "@/components/ui/badge";
import { MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ActionItem {
  id: string;
  type: string;
  client: string;
  note: string;
  priority: "urgent" | "medium";
  duration: string;
}

const actionItems: ActionItem[] = [
  {
    id: "1",
    type: "KYC",
    client: "نورة العتبي",
    note: "صورة الهوية غير واضحة",
    priority: "urgent",
    duration: "35 دقيقة",
  },
  {
    id: "2",
    type: "إبداع",
    client: "لينا الفارس",
    note: "مرجع حوالة مفقود",
    priority: "medium",
    duration: "20 دقيقة",
  },
  {
    id: "3",
    type: "ربط بنك",
    client: "محمد الشهري",
    note: "موافقة منتهية (Lean-SNB)",
    priority: "urgent",
    duration: "ساعتان",
  },
  {
    id: "4",
    type: "سحب",
    client: "سامي القحطاني",
    note: "ينتظر اعتماد مسؤول",
    priority: "medium",
    duration: "50 دقيقة",
  },
  {
    id: "5",
    type: "تحويل",
    client: "عبد الرحمن المالكي",
    note: "تشابه أسماء: يلزم إثبات إضافي",
    priority: "urgent",
    duration: "6 ساعات",
  },
  {
    id: "6",
    type: "تقارير",
    client: "ريم الزهراني",
    note: "إعادة مصادقة مطلوبة (Plaid)",
    priority: "urgent",
    duration: "1 ساعة 10 دقائق",
  },
  {
    id: "7",
    type: "إعدادات",
    client: "عبد العزيز المطيري",
    note: "رصيد غير كاف - بطاقة",
    priority: "medium",
    duration: "4 ساعات",
  },
  {
    id: "8",
    type: "مساعدة",
    client: "جود العتبي",
    note: "Provider outage (Tarabut)",
    priority: "urgent",
    duration: "يوم واحد",
  },
  {
    id: "9",
    type: "تأكيد الهوية",
    client: "فاطمة السبيعي",
    note: "طلب قيد المراجعة",
    priority: "medium",
    duration: "3 ساعات",
  },
  {
    id: "10",
    type: "تنبيهات",
    client: "سلطانة الهذلي",
    note: "معلومات غير كاملة في الطلب",
    priority: "medium",
    duration: "15 دقيقة",
  },
  {
    id: "11",
    type: "دعم العملاء",
    client: "يوسف القحطاني",
    note: "تحديث بيانات حسابة مطلوب",
    priority: "urgent",
    duration: "نصف يوم",
  },
];

export const ActionTable = () => {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">النوع</TableHead>
            <TableHead className="text-right">العميل</TableHead>
            <TableHead className="text-right">الملخص</TableHead>
            <TableHead className="text-right">الأولوية</TableHead>
            <TableHead className="text-right">المهلة</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actionItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-sm">{item.type}</TableCell>
              <TableCell className="text-sm">{item.client}</TableCell>
              <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{item.note}</TableCell>
              <TableCell>
                <Badge
                  variant={item.priority === "urgent" ? "destructive" : "secondary"}
                  className={
                    item.priority === "urgent"
                      ? "bg-urgent text-urgent-foreground hover:bg-urgent/90"
                      : "bg-warning text-warning-foreground hover:bg-warning/90"
                  }
                >
                  {item.priority === "urgent" ? "عاجلة" : "متوسطة"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{item.duration}</TableCell>
              <TableCell>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
};
