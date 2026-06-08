import { LocalTime } from "@/components/shared/LocalTime";

export function CreditHistory({ transactions }: { transactions: any[] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="brutal rounded-2xl bg-card p-5 text-center text-sm font-medium text-muted-foreground mt-4">
        No credit transactions yet.
      </div>
    );
  }

  return (
    <section className="mt-6">
      <h2 className="font-display text-lg mb-3">Credit History</h2>
      <div className="brutal rounded-2xl bg-card overflow-hidden">
        <ul className="divide-y-2 divide-border">
          {transactions.map((tx) => (
            <li key={tx.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-card-foreground">{tx.description || "Credit transaction"}</p>
                <p className="text-xs font-medium text-muted-foreground mt-1">
                  <LocalTime iso={tx.created_at} format="relative" />
                </p>
              </div>
              <div className={`font-display text-lg whitespace-nowrap ${tx.amount >= 0 ? "text-lime-600 dark:text-lime-400" : "text-red-600 dark:text-red-400"}`}>
                {tx.amount > 0 ? "+" : ""}{tx.amount}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
