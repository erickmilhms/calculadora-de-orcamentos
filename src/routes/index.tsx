import { createFileRoute } from "@tanstack/react-router";
import { BudgetCalculator } from "../components/BudgetCalculator";
import { ScrollEffects } from "../components/ScrollEffects";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <>
      <ScrollEffects />
      <BudgetCalculator />
    </>
  );
}
