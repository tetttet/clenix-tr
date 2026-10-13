import {
  Sparkles,
  Droplets,
  Paintbrush,
  KeyRound,
  ShieldCheck,
  AirVent,
} from "lucide-react";
import type { ServiceId } from "@/lib/services";
const icons = {
  "deep-cleaning": Sparkles,
  maintenance: Droplets,
  renovation: Paintbrush,
  tenancy: KeyRound,
  disinfection: ShieldCheck,
  ac: AirVent,
};
export default function ServiceIcon({
  service,
  size = 25,
}: {
  service: ServiceId;
  size?: number;
}) {
  const Icon = icons[service];
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}
