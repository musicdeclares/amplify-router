import { Tour } from "@/app/types/router";

export interface TourStatus {
  label: "Active" | "Upcoming" | "Completed" | "Inactive";
  variant: "secondary" | "outline";
  order: number;
}

export function getTourStatus(tour: Pick<Tour, "enabled" | "start_date" | "end_date">): TourStatus {
  if (!tour.enabled)
    return { label: "Inactive", variant: "outline", order: 3 };

  const today = new Date().toISOString().split("T")[0];
  if (tour.end_date < today)
    return { label: "Completed", variant: "outline", order: 2 };
  if (tour.start_date > today)
    return { label: "Upcoming", variant: "outline", order: 1 };
  return { label: "Active", variant: "secondary", order: 0 };
}

export function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  const shortOpts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const yearOpts: Intl.DateTimeFormatOptions = { year: "2-digit" };

  const startShort = start.toLocaleDateString("en-US", shortOpts);
  const endShort = end.toLocaleDateString("en-US", shortOpts);
  const startYear = start.toLocaleDateString("en-US", yearOpts);
  const endYear = end.toLocaleDateString("en-US", yearOpts);

  if (startYear === endYear) {
    return `${startShort} – ${endShort} '${startYear}`;
  }
  return `${startShort} '${startYear} – ${endShort} '${endYear}`;
}
