// Shared TypeScript types for DataDuck frontend

export interface User {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user_id: string;
  email: string;
  full_name: string;
}

export interface OTPResponse {
  message: string;
  email: string;
  requires_otp: boolean;
}

export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  user_id?: string;
  email: string;
  full_name?: string;
  requires_otp?: boolean;
  message?: string;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  db_type: string;
  masked_connection_string: string;
  host: string | null;
  port: number | null;
  database_name: string | null;
  username: string | null;
  is_connected: boolean;
  last_tested_at: string | null;
  schema_analyzed_at: string | null;
  created_at: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  db_type?: string;
  database_name?: string;
}

export interface VisualizationSpec {
  required: boolean;
  type?: 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'table' | 'kpi';
  title?: string;
  description?: string;
  x_key?: string;
  y_keys?: string[];
  value_key?: string;
  label_key?: string;
  format?: 'currency' | 'percentage' | 'number' | null;
}

export interface QueryInfo {
  display: boolean;
  language: string;
  content: string;
}

export interface QueryResultData {
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  truncated: boolean;
  execution_time_ms?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  answer: string;
  insights: string[];
  warnings: string[];
  query?: QueryInfo;
  result?: QueryResultData;
  visualization?: VisualizationSpec;
  created_at: string;
}

export interface ChatResponse {
  conversation_id: string;
  conversation_title: string;
  message: ChatMessage;
}

export interface Conversation {
  id: string;
  title: string;
  database_id: string;
  database_name: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface SchemaOverview {
  database_id: string;
  db_type: string;
  database_name: string;
  total_tables: number;
  total_relationships: number;
  tables: TableSummary[];
  relationships: RelationshipInfo[];
  analyzed_at: string | null;
}

export interface TableSummary {
  name: string;
  row_count?: number;
  column_count: number;
  columns: string[];
}

export interface RelationshipInfo {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
}

export interface ApiError {
  error: string;
  code: string;
}

export type LoadingStage =
  | 'understanding'
  | 'retrieving-schema'
  | 'generating-query'
  | 'validating'
  | 'executing'
  | 'analyzing'
  | 'visualizing'
  | null;
