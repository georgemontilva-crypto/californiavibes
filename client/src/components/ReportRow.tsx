import { formatDate } from "@/lib/catalog";
import { FileText } from "lucide-react";

type Report = {
  id: number;
  title: string;
  batch: string | null;
  lab: string | null;
  testedOn: string | null;
  fileUrl: string;
};

/** One certificate: what it is, which batch, and the button that opens it. */
export function ReportRow({ report }: { report: Report }) {
  const meta = [
    report.batch ? `Batch ${report.batch}` : null,
    report.testedOn ? `Tested ${formatDate(report.testedOn)}` : null,
    report.lab,
  ].filter(Boolean);

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-cream">{report.title}</p>
        {meta.length > 0 && (
          <p className="mt-0.5 text-sm font-semibold uppercase tracking-wider text-haze">
            {meta.join("  /  ")}
          </p>
        )}
      </div>
      <a
        href={report.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-accent btn-sm shrink-0 self-start sm:self-auto"
      >
        <FileText className="h-4.5 w-4.5" />
        Open report
      </a>
    </li>
  );
}
