import prisma from "@/lib/prisma";
import Link from "next/link";

async function getDashboardStats() {
  const [
    totalProperties,
    activeBookings,
    pendingCleaning,
    openTasks,
    recentTransactions,
  ] = await Promise.all([
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.booking.count({
      where: {
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
        checkOut: { gte: new Date() },
      },
    }),
    prisma.cleaningJob.count({ where: { status: { in: ["PENDING", "SCHEDULED"] } } }),
    prisma.task.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.transaction.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { property: true },
    }),
  ]);

  return {
    totalProperties,
    activeBookings,
    pendingCleaning,
    openTasks,
    recentTransactions,
  };
}

export default async function DashboardPage() {
  let stats = {
    totalProperties: 0,
    activeBookings: 0,
    pendingCleaning: 0,
    openTasks: 0,
    recentTransactions: [] as Awaited<ReturnType<typeof getDashboardStats>>["recentTransactions"],
  };

  try {
    stats = await getDashboardStats();
  } catch {
    // Database might not be connected yet
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light text-foreground">
          Good afternoon
        </h1>
        <p className="text-muted-foreground mt-1">
          Here is an overview of your property portfolio.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden shadow-sm">
        <Link href="/properties" className="bg-card p-6 hover:bg-muted/30 transition-colors">
          <p className="text-3xl font-light tracking-tight">{stats.totalProperties}</p>
          <p className="text-sm text-muted-foreground mt-1">Properties</p>
        </Link>

        <Link href="/bookings" className="bg-card p-6 hover:bg-muted/30 transition-colors">
          <p className="text-3xl font-light tracking-tight">{stats.activeBookings}</p>
          <p className="text-sm text-muted-foreground mt-1">Active Bookings</p>
        </Link>

        <Link href="/cleaning" className="bg-card p-6 hover:bg-muted/30 transition-colors">
          <p className="text-3xl font-light tracking-tight">{stats.pendingCleaning}</p>
          <p className="text-sm text-muted-foreground mt-1">Pending Cleanings</p>
        </Link>

        <Link href="/tasks" className="bg-card p-6 hover:bg-muted/30 transition-colors">
          <p className="text-3xl font-light tracking-tight">{stats.openTasks}</p>
          <p className="text-sm text-muted-foreground mt-1">Open Tasks</p>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">Recent Transactions</h2>
            <Link href="/finance" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>

          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            {stats.recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium">{transaction.description || transaction.category}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {transaction.property?.name || "—"}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium tabular-nums ${
                        transaction.type === "INCOME" ? "text-emerald-700" : "text-foreground"
                      }`}>
                        {transaction.type === "INCOME" ? "+" : "−"}{transaction.currency} {transaction.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-medium mb-6">Quick Actions</h2>

          <div className="bg-card rounded-lg border border-border shadow-sm divide-y divide-border">
            <Link
              href="/properties/new"
              className="block p-4 hover:bg-muted/30 transition-colors"
            >
              <p className="font-medium">Add Property</p>
              <p className="text-sm text-muted-foreground">Register a new rental</p>
            </Link>

            <Link
              href="/bookings/new"
              className="block p-4 hover:bg-muted/30 transition-colors"
            >
              <p className="font-medium">New Booking</p>
              <p className="text-sm text-muted-foreground">Create a reservation</p>
            </Link>

            <Link
              href="/tasks/new"
              className="block p-4 hover:bg-muted/30 transition-colors"
            >
              <p className="font-medium">Create Task</p>
              <p className="text-sm text-muted-foreground">Add maintenance item</p>
            </Link>

            <Link
              href="/cleaning"
              className="block p-4 hover:bg-muted/30 transition-colors"
            >
              <p className="font-medium">Schedule Cleaning</p>
              <p className="text-sm text-muted-foreground">Manage cleanings</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
