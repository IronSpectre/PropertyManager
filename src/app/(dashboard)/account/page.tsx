export default function AccountPage() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-light text-foreground">Account</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      {/* Profile Section */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-medium">Profile</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p className="font-medium">Property Manager</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium">admin@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-medium">Settings</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            Authentication is currently disabled. Account settings will be available when login is enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
