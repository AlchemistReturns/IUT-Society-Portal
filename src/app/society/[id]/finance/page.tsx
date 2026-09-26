import Link from "next/link";
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Finance</p>
          <h1 className="text-2xl font-semibold">{society?.name}</h1>
        </div>
        <Link href={`/society/${id}`} className="text-sm underline">
          Back to society
        </Link>
      </div>

      <div className="flex flex-col gap-10">
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryCard label="Total income" value={totalIncome} accent="income" />
          <SummaryCard label="Total expense" value={totalExpense} accent="expense" />
          <SummaryCard label="Net balance" value={netBalance} accent="balance" />
          <SummaryCard
            label="This month (net)"
            value={currentMonthIncome - currentMonthExpense}
            accent="balance"
          />
        </section>

        <section className="grid gap-8 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-4">
            <h2 className="mb-2 text-sm font-medium text-gray-600">Monthly income vs expense</h2>
            <MonthlyBarChart data={monthlyData} />
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <h2 className="mb-2 text-sm font-medium text-gray-600">Expense by category</h2>
            <CategoryPieChart data={categoryData} />
          </div>
          <div className="rounded-xl border border-gray-200 p-4 sm:col-span-2">
            <h2 className="mb-2 text-sm font-medium text-gray-600">Running balance</h2>
            <BalanceLineChart data={balanceData} />
          </div>
        </section>

        {isAdmin && (
          <section>
            <h2 className="mb-3 text-lg font-medium">Add entry</h2>
            <form action={addFinanceEntry} className="flex flex-wrap gap-2 sm:max-w-2xl">
              <input type="hidden" name="society_id" value={id} />
              <select name="type" required className="rounded-md border px-3 py-2 text-sm">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <input name="amount" type="number" step="0.01" min="0" placeholder="Amount" required className="rounded-md border px-3 py-2 text-sm" />
              <input name="category" placeholder="Category" required className="rounded-md border px-3 py-2 text-sm" />
              <input name="date" type="date" required className="rounded-md border px-3 py-2 text-sm" />
              <input name="note" placeholder="Note" className="rounded-md border px-3 py-2 text-sm" />
              <button className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white">
                Add
              </button>
            </form>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-lg font-medium">Entries</h2>
          <div className="flex flex-col gap-2">
            {[...entries].reverse().map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
                <span>
                  {e.date} — {e.category} —{" "}
                  <span className={e.type === "income" ? "text-green-700" : "text-red-700"}>
                    {e.type === "income" ? "+" : "-"}
                    {Number(e.amount).toFixed(2)}
                  </span>
                  {e.note && <span className="text-gray-400"> ({e.note})</span>}
                </span>
                {isAdmin && (
                  <form action={deleteFinanceEntry}>
                    <input type="hidden" name="society_id" value={id} />
                    <input type="hidden" name="entry_id" value={e.id} />
                    <button className="text-xs text-red-600 underline">Delete</button>
                  </form>
                )}
              </div>
            ))}
            {!entries.length && <p className="text-sm text-gray-500">No entries yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "income" | "expense" | "balance";
}) {
  const accentClass =
    accent === "income"
      ? "border-l-green-500 text-green-700"
      : accent === "expense"
        ? "border-l-red-500 text-red-700"
        : "border-l-[var(--accent-from)] text-[var(--accent-from)]";

  return (
    <div className={`rounded-xl border border-gray-200 border-l-4 p-4 ${accentClass}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value.toFixed(2)}</p>
    </div>
  );
}
