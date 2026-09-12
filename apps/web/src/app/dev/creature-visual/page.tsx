import { notFound } from "next/navigation";
import { CreatureTestLab } from "../../../components/creature-test-lab";

// O portão é por requisição: estático congelaria o 404 no build e CREATURE_VISUAL_LAB nunca ligaria.
export const dynamic = "force-dynamic";

export default function Page() {
  if (process.env.NODE_ENV === "production" && process.env.CREATURE_VISUAL_LAB !== "1") {
    notFound();
  }
  return <CreatureTestLab />;
}
