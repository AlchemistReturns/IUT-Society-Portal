"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const CATEGORY_COLORS = [
  "#0f5a45",
  "#d97706",
  "#2f8f6b",
  "#b42318",
  "#6aa88c",
  "#a16207",
  "#3b6ea5",
  "#8a9a91",
];

const GRID = "#e3ebe6";
const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid #dde6e0",
  fontSize: 12,
};

const fmt = (n: number) => n.toLocaleString("en-US");

export function MonthlyBarChart({
  data,
}: {
  data: { month: string; income: number; expense: number }[];
}) {
  if (!data.length) return <p className="py-10 text-center text-sm text-gray-500">No entries yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="month" fontSize={12} tickLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={fmt} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `৳ ${fmt(Number(v))}`} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" fill="#0f5a45" name="Income" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#d97706" name="Expense" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart({
  data,
}: {
  data: { category: string; amount: number }[];
}) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-gray-500">No expense data yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `৳ ${fmt(Number(v))}`} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BalanceLineChart({
  data,
}: {
  data: { date: string; balance: number }[];
}) {
  if (!data.length) return <p className="py-10 text-center text-sm text-gray-500">No entries yet.</p>;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="date" fontSize={12} tickLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={fmt} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => `৳ ${fmt(Number(v))}`} />
        <Line type="monotone" dataKey="balance" name="Balance" stroke="#0f5a45" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
