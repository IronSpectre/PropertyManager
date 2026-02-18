import { PropertyForm } from "@/components/properties/property-form";

export default function NewPropertyPage() {
  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-light text-foreground">Add Property</h1>
        <p className="text-muted-foreground mt-1">
          Add a new property to your portfolio
        </p>
      </div>
      <PropertyForm />
    </div>
  );
}
