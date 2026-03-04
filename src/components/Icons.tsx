import {
  Rocket, Plane, Radiation, Globe, Waves, PlaneTakeoff,
  AlertTriangle, Target, Bed, UtensilsCrossed, ShowerHead,
  Car, Briefcase, Users, School, Baby, Siren, BarChart3,
  Building2, FlaskConical, Calendar, CalendarDays, Search,
  Moon, Sun, Bot, TrendingUp, Heart, Shield, Clock,
  TrendingDown,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";

// Alert category icon lookup
export const CATEGORY_ICONS: Record<number, ComponentType<LucideProps>> = {
  1: Rocket,
  2: Plane,
  3: Radiation,
  4: Globe,
  5: Waves,
  6: PlaneTakeoff,
  7: AlertTriangle,
  13: Target,
};

// Where Were You activity icon lookup
export const ACTIVITY_ICONS: Record<string, ComponentType<LucideProps>> = {
  sleeping: Bed,
  eating: UtensilsCrossed,
  shower: ShowerHead,
  driving: Car,
  working: Briefcase,
  family: Users,
  school: School,
  kids: Baby,
};

// Shield logo (replaces lion emoji)
export function ShieldLogo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2L3 7v5c0 5.25 3.82 10.17 9 11.38 5.18-1.21 9-6.13 9-11.38V7l-9-5z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

// Re-export commonly used icons for direct import
export {
  Siren as IconAlert,
  BarChart3 as IconStats,
  Building2 as IconCity,
  Rocket as IconRocket,
  FlaskConical as IconLab,
  Calendar as IconCalendar,
  CalendarDays as IconCalendarWeek,
  Search as IconSearch,
  Moon as IconMoon,
  Sun as IconSun,
  Bot as IconAI,
  TrendingUp as IconTrendUp,
  TrendingDown as IconTrendDown,
  Heart as IconThanks,
  Shield as IconShield,
  Clock as IconClock,
  Target as IconTarget,
  AlertTriangle as IconWarning,
};
