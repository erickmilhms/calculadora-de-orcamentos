import { createFileRoute } from "@tanstack/react-router";
import { BudgetCalculator } from "../components/BudgetCalculator";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <BudgetCalculator />;
}
