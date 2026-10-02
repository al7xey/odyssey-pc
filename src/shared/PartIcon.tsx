import {
  Cpu,
  CircuitBoard,
  Gpu,
  MemoryStick,
  HardDrive,
  Fan,
  Zap,
  PcCase,
  type LucideIcon,
} from 'lucide-react';
import type { Category } from '../entities/catalog';
const icons: Record<Category, LucideIcon> = {
  case: PcCase,
  cpu: Cpu,
  motherboard: CircuitBoard,
  gpu: Gpu,
  ram: MemoryStick,
  storage: HardDrive,
  cooler: Fan,
  psu: Zap,
};
export default function PartIcon({ category, size = 20 }: { category: Category; size?: number }) {
  const Icon = icons[category];
  return <Icon size={size} strokeWidth={1.5} />;
}
