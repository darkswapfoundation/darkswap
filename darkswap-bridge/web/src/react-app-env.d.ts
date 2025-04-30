/// <reference types="react-scripts" />

// Define custom types for external modules that don't have type definitions

declare module 'react-chartjs-2' {
  import { ChartData, ChartOptions } from 'chart.js';
  
  export interface LineProps {
    data: ChartData;
    options?: ChartOptions;
    height?: number;
    width?: number;
    id?: string;
    className?: string;
    redraw?: boolean;
    fallbackContent?: React.ReactNode;
    role?: string;
    datasetIdKey?: string;
  }
  
  export class Line extends React.Component<LineProps> {}
  
  export interface BarProps {
    data: ChartData;
    options?: ChartOptions;
    height?: number;
    width?: number;
    id?: string;
    className?: string;
    redraw?: boolean;
    fallbackContent?: React.ReactNode;
    role?: string;
    datasetIdKey?: string;
  }
  
  export class Bar extends React.Component<BarProps> {}
  
  export interface PieProps {
    data: ChartData;
    options?: ChartOptions;
    height?: number;
    width?: number;
    id?: string;
    className?: string;
    redraw?: boolean;
    fallbackContent?: React.ReactNode;
    role?: string;
    datasetIdKey?: string;
  }
  
  export class Pie extends React.Component<PieProps> {}
  
  export interface DoughnutProps {
    data: ChartData;
    options?: ChartOptions;
    height?: number;
    width?: number;
    id?: string;
    className?: string;
    redraw?: boolean;
    fallbackContent?: React.ReactNode;
    role?: string;
    datasetIdKey?: string;
  }
  
  export class Doughnut extends React.Component<DoughnutProps> {}
}

declare module 'web-vitals' {
  export interface ReportHandler {
    (metric: {
      name: string;
      delta: number;
      id: string;
      entries: any[];
      value: number;
    }): void;
  }
  
  export function getCLS(onReport: ReportHandler): void;
  export function getFID(onReport: ReportHandler): void;
  export function getFCP(onReport: ReportHandler): void;
  export function getLCP(onReport: ReportHandler): void;
  export function getTTFB(onReport: ReportHandler): void;
}

// Define custom types for the application

interface WebSocketEvent {
  event_type: string;
  data: any;
}

interface User {
  id: string;
  username: string;
}

interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
}

interface Transaction {
  txid: string;
  amount: number;
  recipient: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

interface Order {
  id: string;
  order_type: 'Buy' | 'Sell';
  sell_asset: string;
  sell_amount: number;
  buy_asset: string;
  buy_amount: number;
  peer_id: string;
  timestamp: number;
  status: 'Open' | 'Filled' | 'Cancelled';
}

interface Trade {
  id: string;
  order_id: string;
  maker_id: string;
  taker_id: string;
  sell_asset: string;
  sell_amount: number;
  buy_asset: string;
  buy_amount: number;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Executed' | 'Confirmed' | 'Cancelled' | 'Failed';
  timestamp: number;
}

interface Peer {
  id: string;
  address: string;
  connected_since: number;
  last_seen: number;
  status: 'Connected' | 'Disconnected';
  direction: 'Inbound' | 'Outbound';
}

interface Settings {
  theme: string;
  language: string;
  notifications_enabled: boolean;
  auto_connect: boolean;
  auto_start: boolean;
  api_url: string;
  websocket_url: string;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
  read: boolean;
}