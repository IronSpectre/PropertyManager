"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  currency: string;
  description: string | null;
  date: string;
  property: { id: string; name: string } | null;
}

interface Property {
  id: string;
  name: string;
  rent: number | null;
  rentDueDay: number | null;
  dailyRate: number | null;
  status: string;
}

interface Booking {
  id: string;
  totalAmount: number | null;
  status: string;
  checkIn: string;
  property: { id: string; name: string };
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchData = async () => {
    try {
      const [transRes, propRes, bookRes] = await Promise.all([
        fetch(`/api/finance${typeFilter !== "all" ? `?type=${typeFilter}` : ""}`),
        fetch("/api/properties"),
        fetch("/api/bookings"),
      ]);

      if (transRes.ok) {
        const data = await transRes.json();
        setTransactions(data.transactions);
        setTotals(data.totals);
      }

      if (propRes.ok) {
        const data = await propRes.json();
        setProperties(data);
      }

      if (bookRes.ok) {
        const data = await bookRes.json();
        setBookings(data);
      }
    } catch {
      console.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter]);

  // Calculate rent (expense)
  const propertiesWithRent = properties.filter((p) => p.rent && p.status === "ACTIVE");
  const totalMonthlyRent = propertiesWithRent.reduce((sum, p) => sum + (p.rent || 0), 0);

  // Calculate booking income (confirmed/checked-in/checked-out bookings)
  const completedBookings = bookings.filter((b) =>
    ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(b.status)
  );
  const totalBookingIncome = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Totals: income from bookings, expenses include rent
  const totalIncome = totals.income + totalBookingIncome;
  const totalExpense = totals.expense + totalMonthlyRent;
  const netBalance = totalIncome - totalExpense;

  // Break-even analysis
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  // Properties eligible for break-even analysis (have both rent and dailyRate)
  const propertiesForBreakEven = properties.filter(
    (p) => p.rent && p.dailyRate && p.status === "ACTIVE"
  );

  // Calculate break-even data for each property
  const breakEvenData = propertiesForBreakEven.map((property) => {
    const rent = property.rent!;
    const dailyRate = property.dailyRate!;

    // Min occupancy % needed to break even
    const minOccupancy = (rent / (dailyRate * daysInMonth)) * 100;

    // Current month income from bookings for this property
    const propertyBookings = bookings.filter(
      (b) =>
        b.property.id === property.id &&
        ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(b.status) &&
        new Date(b.checkIn).getMonth() === currentMonth &&
        new Date(b.checkIn).getFullYear() === currentYear
    );
    const monthlyIncome = propertyBookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0
    );

    // Shortfall or surplus
    const balance = monthlyIncome - rent;

    return {
      property,
      rent,
      dailyRate,
      minOccupancy,
      monthlyIncome,
      balance,
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-2xl font-light text-foreground">Finance</h1>
          <p className="text-muted-foreground mt-1">Loading...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-foreground">Finance</h1>
          <p className="text-muted-foreground mt-1">Track income and expenses</p>
        </div>
        <Button asChild>
          <Link href="/finance/new">Add Transaction</Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-px bg-border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-card p-6">
          <p className="text-3xl font-light tracking-tight text-emerald-700">
            +£{totalIncome.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Total Income</p>
          {totalBookingIncome > 0 && (
            <p className="text-xs text-muted-foreground mt-1">£{totalBookingIncome.toFixed(2)} from bookings</p>
          )}
        </div>
        <div className="bg-card p-6">
          <p className="text-3xl font-light tracking-tight text-red-700">
            −£{totalExpense.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Total Expenses</p>
          {totalMonthlyRent > 0 && (
            <p className="text-xs text-muted-foreground mt-1">£{totalMonthlyRent.toFixed(2)}/mo rent</p>
          )}
        </div>
        <div className="bg-card p-6">
          <p className={`text-3xl font-light tracking-tight ${
            netBalance >= 0 ? "text-emerald-700" : "text-red-700"
          }`}>
            £{netBalance.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Net Balance</p>
        </div>
      </div>

      {/* Monthly Rent Breakdown */}
      {propertiesWithRent.length > 0 && (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-medium">Monthly Rent (Expense)</h2>
            <p className="text-lg font-medium text-red-700">−£{totalMonthlyRent.toFixed(2)}</p>
          </div>
          <div className="divide-y divide-border">
            {propertiesWithRent.map((property) => (
              <div key={property.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{property.name}</p>
                  {property.rentDueDay && (
                    <p className="text-xs text-muted-foreground">
                      Due: {property.rentDueDay}{property.rentDueDay === 1 ? "st" : property.rentDueDay === 2 ? "nd" : property.rentDueDay === 3 ? "rd" : "th"} of month
                    </p>
                  )}
                </div>
                <p className="font-medium tabular-nums">£{property.rent?.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Break-Even Analysis */}
      {breakEvenData.length > 0 && (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-medium">Break-Even Analysis</h2>
            <p className="text-sm text-muted-foreground">{monthName}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left bg-muted/30">
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Rent</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Rate</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Min Occ.</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Income</th>
                  <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {breakEvenData.map((data) => (
                  <tr key={data.property.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/properties/${data.property.id}`}
                        className="font-medium text-sm hover:text-primary transition-colors"
                      >
                        {data.property.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-sm">
                      £{data.rent.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-sm">
                      £{data.dailyRate.toFixed(0)}/n
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-sm">
                      {data.minOccupancy.toFixed(0)}%
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums text-sm">
                      £{data.monthlyIncome.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {data.balance >= 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                          +£{data.balance.toFixed(0)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700">
                          −£{Math.abs(data.balance).toFixed(0)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Properties missing daily rate */}
      {propertiesWithRent.filter((p) => !p.dailyRate).length > 0 && (
        <div className="bg-muted/30 rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Missing daily rate:</span>{" "}
            {propertiesWithRent
              .filter((p) => !p.dailyRate)
              .map((p) => p.name)
              .join(", ")}
            .{" "}
            <Link href="/properties" className="text-primary hover:underline">
              Set rates to enable break-even tracking.
            </Link>
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-16 border border-border rounded-lg bg-card">
          <h2 className="text-lg font-medium mb-2">No transactions</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Start tracking your finances by adding a transaction.
          </p>
          <Button asChild>
            <Link href="/finance/new">Add Transaction</Link>
          </Button>
        </div>
      ) : (
        /* Transactions List */
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Property</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Category</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium">{transaction.description || transaction.category}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                    {transaction.property?.name || "—"}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className={`px-6 py-4 text-right font-medium tabular-nums ${
                    transaction.type === "INCOME" ? "text-emerald-700" : "text-foreground"
                  }`}>
                    {transaction.type === "INCOME" ? "+" : "−"}£{transaction.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
