// Reference list of the sports Sportal supports. Static app configuration, not user data.
import type { Sport } from "@/types";

export const sports: Sport[] = [
  { id: "basketball", name: "Basketball", aiSupported: true },
  { id: "volleyball", name: "Volleyball", aiSupported: false },
  { id: "athletics", name: "Track & Field", aiSupported: false },
  { id: "football", name: "Football", aiSupported: false },
];
