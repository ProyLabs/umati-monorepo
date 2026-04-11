"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

function formatLocalDateTime(date: Date) {
  const timeZoneName = new Intl.DateTimeFormat("en-GB", {
    timeZoneName: "short",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  return `${format(date, "EEE MMM d, HH:mm")} ${timeZoneName ?? ""}`.trim();
}

export function CurrentLocalDateTime() {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    function updateDateTime() {
      setFormatted(formatLocalDateTime(new Date()));
    }

    updateDateTime();

    const interval = window.setInterval(updateDateTime, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  return <span className="font-medium text-sm sm:text-base">{formatted}</span>;
}
