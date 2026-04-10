import ActiveTimerPill from "./active-timer-pill";
import { getActiveTimer } from "@/app/dashboard/time/actions";

export default async function ActiveTimerPillServer() {
  const active = await getActiveTimer();
  return <ActiveTimerPill active={active} />;
}
