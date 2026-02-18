import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {/* Decorative background circle */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/5 scale-150 blur-xl" />
        <div className="relative p-5 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 border border-border/50">
          <Icon className="h-10 w-10 text-primary/70" />
        </div>
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {action &&
        (action.href ? (
          <Button asChild size="lg">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : (
          <Button onClick={action.onClick} size="lg">
            {action.label}
          </Button>
        ))}
    </div>
  );
}
