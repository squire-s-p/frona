import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Календар',
};

import CalendarClient from "@/components/calendar/calendar-client";

export default function CalendarPage() {
  return <CalendarClient />;
}
