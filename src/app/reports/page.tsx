import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const reports = [
  {
    href: "/reports/soon-to-expire",
    title: "Soon to Expire",
    description: "All drivers with a 19-A compliance form due within 30 days, most urgent first.",
    icon: AlertTriangle,
  },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1000px]">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Reports</h1>
        <p className="text-sm text-neutral-500">Compliance reports for the driver roster.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href}>
              <Card className="transition-colors hover:border-neutral-300">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900">{report.title}</p>
                    <p className="text-sm text-neutral-500">{report.description}</p>
                  </div>
                  <ChevronRight className="size-4 text-neutral-300 shrink-0 mt-1" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
