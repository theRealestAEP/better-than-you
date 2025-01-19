declare module 'recharts' {
  import { ComponentType, ReactNode } from 'react';

  interface CommonProps {
    children?: ReactNode;
    width?: string | number;
    height?: string | number;
    data?: Record<string, string | number>[];
    margin?: { top: number; right: number; left: number; bottom: number };
  }

  interface AxisProps extends CommonProps {
    dataKey?: string;
    stroke?: string;
  }

  interface TooltipProps extends CommonProps {
    contentStyle?: React.CSSProperties;
    labelStyle?: React.CSSProperties;
  }

  interface CartesianGridProps extends CommonProps {
    strokeDasharray?: string;
    stroke?: string;
  }

  interface LineProps extends CommonProps {
    type?: string;
    dataKey?: string;
    stroke?: string;
    strokeWidth?: number;
  }

  interface BarProps extends CommonProps {
    dataKey?: string;
    fill?: string;
  }

  export const LineChart: ComponentType<CommonProps>;
  export const Line: ComponentType<LineProps>;
  export const BarChart: ComponentType<CommonProps>;
  export const Bar: ComponentType<BarProps>;
  export const XAxis: ComponentType<AxisProps>;
  export const YAxis: ComponentType<AxisProps>;
  export const CartesianGrid: ComponentType<CartesianGridProps>;
  export const Tooltip: ComponentType<TooltipProps>;
  export const Legend: ComponentType<CommonProps>;
  export const ResponsiveContainer: ComponentType<CommonProps>;
} 