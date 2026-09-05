import { createFileRoute } from "@tanstack/react-router";
import { BudgetCalculator } from "../components/BudgetCalculator";

export const Route = createFileRoute("/")({
  component: BudgetCalculator,
});
