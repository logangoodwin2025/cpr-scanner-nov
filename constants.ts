import { 
  Monitor, BarChart2, Zap, Layers, ArrowUp, ArrowDown, Activity, Database, Briefcase, Cpu, 
  Droplet, Heart, ShoppingCart, Truck, Home, Hammer, Tv, Landmark, FlaskConical 
} from 'lucide-react';
import { Sector } from './types';

export const APP_NAME = "PivotBoss Scnr";

// Real stocks to seed the random generator for a more authentic feel
export const SEED_STOCKS = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: Sector.ENERGY },
  { symbol: "TCS", name: "Tata Consultancy Svcs", sector: Sector.IT },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: Sector.BANKING },
  { symbol: "INFY", name: "Infosys Ltd", sector: Sector.IT },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: Sector.BANKING },
  { symbol: "SBIN", name: "State Bank of India", sector: Sector.PSU_BANK },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: Sector.FINANCE },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: Sector.INFRA },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: Sector.BANKING },
  { symbol: "LT", name: "Larsen & Toubro", sector: Sector.INFRA },
  { symbol: "ITC", name: "ITC Limited", sector: Sector.FMCG },
  { symbol: "AXISBANK", name: "Axis Bank", sector: Sector.BANKING },
  { symbol: "ASIANPAINT", name: "Asian Paints", sector: Sector.CONSUMER },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: Sector.AUTO },
  { symbol: "TITAN", name: "Titan Company", sector: Sector.CONSUMER },
  { symbol: "SUNPHARMA", name: "Sun Pharma", sector: Sector.PHARMA },
  { symbol: "TATAMOTORS", name: "Tata Motors", sector: Sector.AUTO },
  { symbol: "WIPRO", name: "Wipro", sector: Sector.IT },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", sector: Sector.INFRA },
  { symbol: "POWERGRID", name: "Power Grid Corp", sector: Sector.ENERGY },
  { symbol: "DLF", name: "DLF Limited", sector: Sector.REALTY },
  { symbol: "TATASTEEL", name: "Tata Steel", sector: Sector.METAL },
  { symbol: "ZEEL", name: "Zee Entertainment", sector: Sector.MEDIA },
  { symbol: "PNB", name: "Punjab National Bank", sector: Sector.PSU_BANK },
  { symbol: "PIDILITIND", name: "Pidilite Industries", sector: Sector.CHEMICALS },
];

// Thresholds
export const NARROW_CPR_THRESHOLD_PERCENT = 0.20; // Tightened for better signals
export const NEAR_PIVOT_THRESHOLD_PERCENT = 0.5; 

export const ICONS = {
  Monitor,
  BarChart2,
  Zap,
  Layers,
  ArrowUp,
  ArrowDown,
  Activity,
  Database,
  Briefcase,
  Cpu,
  Droplet,
  Heart,
  ShoppingCart,
  Truck,
  Home,
  Hammer,
  Tv,
  Landmark,
  FlaskConical
};

export const SECTOR_ICONS: Record<Sector, any> = {
  [Sector.BANKING]: Briefcase,
  [Sector.IT]: Cpu,
  [Sector.AUTO]: Truck,
  [Sector.ENERGY]: Droplet,
  [Sector.PHARMA]: Heart,
  [Sector.FMCG]: ShoppingCart,
  [Sector.FINANCE]: BarChart2,
  [Sector.CONSUMER]: ShoppingCart,
  [Sector.INFRA]: Database,
  [Sector.REALTY]: Home,
  [Sector.METAL]: Hammer,
  [Sector.MEDIA]: Tv,
  [Sector.PSU_BANK]: Landmark,
  [Sector.CHEMICALS]: FlaskConical,
  [Sector.OTHER]: Activity
};