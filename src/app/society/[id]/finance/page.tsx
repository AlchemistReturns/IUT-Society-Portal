import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, rolesInSociety } from "@/lib/auth";
import { addFinanceEntry, deleteFinanceEntry } from "./actions";
import { MonthlyBarChart, CategoryPieChart, BalanceLineChart } from "./FinanceCharts";

type Entry = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string | null;
  date: string;
};

export default async function FinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: society } = await supabase
    .from("societies")
    .select("name, moderator_id")
    .eq("id", id)
    .single();

  const myRoles = rolesInSociety(user, id);
  const isAdmin = myRoles.includes("admin") || user.globalRoles.includes("super_admin");
  const isExecutive = myRoles.includes("executive");
  const isModerator = society?.moderator_id === user.id;
  if (!isAdmin && !isExecutive && !isModerator) redirect(`/society/${id}`);

  const { data: entriesRaw } = await supabase
    .from("finance_entries")
    .select("id, type, amount, category, note, date")
    .eq("society_id", id)
    .order("date", { ascending: true });

  const entries = (entriesRaw ?? []) as Entry[];

  const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const totalExpense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
  const netBalance = totalIncome - totalExpense;

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthEntries = entries.filter((e) => e.date.startsWith(currentMonthKey));
  const currentMonthIncome = currentMonthEntries.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const currentMonthExpense = currentMonthEntries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);

  const monthlyMap = new Map<string, { month: string; income: number; expense: number }>();
  for (const e of entries) {
    const month = e.date.slice(0, 7);
    const bucket = monthlyMap.get(month) ?? { month, income: 0, expense: 0 };
    if (e.type === "income") bucket.income += Number(e.amount);
    else bucket.expense += Number(e.amount);
    monthlyMap.set(month, bucket);
  }
  const monthlyData = [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month));

  const categoryMap = new Map<string, number>();
  for (const e of entries) {
    if (e.type !== "expense") continue;
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + Number(e.amount));
  }
  const categoryData = [...categoryMap.entries()].map(([category, amount]) => ({ category, amount }));

  const balanceData = entries.reduce<{ date: string; balance: number }[]>((acc, e) => {
    const prev = acc.length ? acc[acc.length - 1].balance : 0;
    const delta = e.type === "income" ? Number(e.amount) : -Number(e.amount);
    acc.push({ date: e.date, balance: prev + delta });
    return acc;
  }, []);

  const money = (n: number) => `৳ ${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col gap-6">
      {!isAdmin && (
        <p className="rounded-lg bg-[var(--accent-soft)] px-4 py-2.5 text-sm text-[var(--accent-from)]">
          Read-only view. Only the society admin can add or remove entries.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Total income" value={money(totalIncome)} tone="income" />
        <SummaryCard label="Total expense" value={money(totalExpense)} tone="expense" />
        <SummaryCard label="Net balance" value={money(netBalance)} tone={netBalance >= 0 ? "balance" : "expense"} />
        <SummaryCard
          label="This month (net)"
          value={money(currentMonthIncome - currentMonthExpense)}
          tone={currentMonthIncome - currentMonthExpense >= 0 ? "balance" : "expense"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-serif text-base font-semibold">Monthly income vs expense</h2>
          <MonthlyBarChart data={monthlyData} />
        </div>
        <div className="card">
          <h2 className="mb-2 font-serif text-base font-semibold">Expense by category</h2>
          <CategoryPieChart data={categoryData} />
        </div>
        <div className="card lg:col-span-2">
          <h2 className="mb-2 font-serif text-base font-semibold">Running balance</h2>
          <BalanceLineChart data={balanceData} />
        </div>
      </section>

      {isAdmin && (
        <section className="card">
          <h2 className="mb-1 font-serif text-lg font-semibold">Add entry</h2>
          <p className="mb-4 text-sm text-gray-500">Record income or an expense. Amounts are in BDT.</p>
          <form action={addFinanceEntry} className="grid gap-2 sm:grid-cols-[8rem_9rem_1fr_10rem] ">
            <input type="hidden" name="society_id" value={id} />
            <select name="type" required className="input">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input name="amount" type="number" step="0.01" min="0" placeholder="Amount" required className="input" />
            <input name="category" placeholder="Category, e.g. Sponsorship" required className="input" />
            <input name="date" type="date" required className="input" />
            <input name="note" placeholder="Note (optional)" className="input sm:col-span-3" />
            <button className="btn btn-primary">Add entry</button>
          </form>
        </section>
      )}

      <section className="card !p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-serif text-lg font-semibold">Entries</h2>
          <span className="badge">{entries.length}</span>
        </div>
        {entries.length === 0 ? (
          <p className="border-t border-[var(--card-border)] px-5 py-8 text-center text-sm text-gray-500">
            No entries yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-[var(--accent-soft)] text-left font-mono text-[11px] uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-5 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  {isAdmin && <th className="w-20 px-5 py-2" />}
                </tr>
              </thead>
              <tbody>
                {[...entries].reverse().map((e) => (
                  <tr key={e.id} className="border-t border-[var(--card-border)]">
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono text-xs text-gray-600">{e.date}</td>
                    <td className="px-3 py-2.5 font-medium">{e.category}</td>
                    <td className="px-3 py-2.5 text-gray-500">{e.note ?? ""}</td>
                    <td className={`whitespace-nowrap px-3 py-2.5 text-right font-mono ${e.type === "income" ? "text-[var(--accent-from)]" : "text-red-700"}`}>
                      {e.type === "income" ? "+" : "−"} {money(Number(e.amount))}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-2.5 text-right">
                        <form action={deleteFinanceEntry}>
                          <input type="hidden" name="society_id" value={id} />
                          <input type="hidden" name="entry_id" value={e.id} />
                          <button className="btn btn-danger btn-sm">Delete</button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense" | "balance";
}) {
  const color =
    tone === "expense" ? "text-red-700" : "text-[var(--accent-from)]";
  const bar = tone === "expense" ? "bg-red-600" : tone === "income" ? "bg-emerald-500" : "bg-[var(--accent-from)]";
  return (
    <div className="card relative overflow-hidden !py-4">
      <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} />
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 font-serif text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
