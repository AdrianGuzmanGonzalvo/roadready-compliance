import * as React from "react";
import { cn } from "@/lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-x-auto print:overflow-visible">
      <table className={cn("w-full caption-bottom text-sm print:w-full print:table-fixed", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("[&_tr]:border-b [&_tr]:border-neutral-200", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return <tfoot className={cn("border-t border-neutral-200 bg-neutral-50 font-medium", className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-b border-neutral-100 transition-colors hover:bg-neutral-50", className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-10 whitespace-nowrap px-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wide [&:has([role=checkbox])]:pr-0 print:h-auto print:whitespace-normal print:break-words print:px-2 print:py-1",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn(
        "whitespace-nowrap px-3 py-2.5 align-middle [&:has([role=checkbox])]:pr-0 print:whitespace-normal print:break-words print:px-2 print:py-1 print:text-xs",
        className
      )}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell };
