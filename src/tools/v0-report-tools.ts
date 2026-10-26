/**
 * Reporting v0 Tools
 *
 * Exposes the v0 usage and activity reports so Claude can observe token cost
 * and team activity directly from a conversation.
 */

import { DiscoveredMethod } from '../types.js';
import { compact } from './helpers.js';

/**
 * Creates the reporting v0 tool set.
 *
 * @param client - The v0 SDK client
 * @returns Array of tool definitions
 */
export function createReportTools(client: any): DiscoveredMethod[] {
  const builders = [createAiUsageTool, createUsageEventsTool, createUserActivityTool];

  const tools: DiscoveredMethod[] = [];
  for (const build of builders) {
    const tool = build(client);
    if (tool) tools.push(tool);
  }

  return tools;
}

/**
 * Builds the `ai_usage` tool (token-level usage per model).
 */
function createAiUsageTool(client: any): DiscoveredMethod | null {
  if (!client?.reports?.getAIUsage) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'ai_usage',
    toolName: 'ai_usage',
    description:
      'Get token-level AI usage (input/output/cache tokens per model and request). Use to understand generation cost. Supports an optional date range (start/end) and pagination (cursor, limit).',
    sdkFunction: async (params: { start?: string; end?: string; cursor?: string; limit?: number }) => {
      const result = await client.reports.getAIUsage(compact({
        start: params?.start,
        end: params?.end,
        cursor: params?.cursor,
        limit: params?.limit
      }));

      return {
        events: result?.data || [],
        nextCursor: result?.pagination?.nextCursor ?? null,
        dateRange: result?.dateRange ?? { start: null, end: null }
      };
    },
    parameters: [
      {
        name: 'start',
        type: 'string',
        required: false,
        description: 'Start of the date range (ISO 8601)'
      },
      {
        name: 'end',
        type: 'string',
        required: false,
        description: 'End of the date range (ISO 8601)'
      },
      {
        name: 'cursor',
        type: 'string',
        required: false,
        description: 'Pagination cursor from a previous response'
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Max events to return'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.ai_usage'
  };
}

/**
 * Builds the `usage_events` tool (raw usage events).
 */
function createUsageEventsTool(client: any): DiscoveredMethod | null {
  if (!client?.reports?.getUsage) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'usage_events',
    toolName: 'usage_events',
    description:
      'Get raw usage events (message generation, image generation, inline edits, etc.) with cost breakdown. Filter by date range, chatId, messageId, or userId.',
    sdkFunction: async (params: any) => {
      const result = await client.reports.getUsage(compact({
        startDate: params?.startDate,
        endDate: params?.endDate,
        chatId: params?.chatId,
        messageId: params?.messageId,
        userId: params?.userId,
        limit: params?.limit,
        cursor: params?.cursor
      }));

      return {
        events: result?.data || [],
        totalCount: result?.meta?.totalCount ?? (result?.data || []).length,
        hasMore: result?.pagination?.hasMore ?? false,
        nextCursor: result?.pagination?.nextCursor ?? null
      };
    },
    parameters: [
      {
        name: 'startDate',
        type: 'string',
        required: false,
        description: 'Start date filter'
      },
      {
        name: 'endDate',
        type: 'string',
        required: false,
        description: 'End date filter'
      },
      {
        name: 'chatId',
        type: 'string',
        required: false,
        description: 'Filter to a specific chat'
      },
      {
        name: 'messageId',
        type: 'string',
        required: false,
        description: 'Filter to a specific message'
      },
      {
        name: 'userId',
        type: 'string',
        required: false,
        description: 'Filter to a specific user'
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Max events to return'
      },
      {
        name: 'cursor',
        type: 'string',
        required: false,
        description: 'Pagination cursor'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.usage_events'
  };
}

/**
 * Builds the `user_activity` tool (per-user activity summary).
 */
function createUserActivityTool(client: any): DiscoveredMethod | null {
  if (!client?.reports?.getUserActivity) {
    return null;
  }

  return {
    namespace: 'v0',
    method: 'user_activity',
    toolName: 'user_activity',
    description:
      'Get per-user activity summary (chat/message counts, active days) for a date range. Useful for team usage oversight.',
    sdkFunction: async (params: { startDate?: string; endDate?: string }) => {
      const result = await client.reports.getUserActivity(compact({
        startDate: params?.startDate,
        endDate: params?.endDate
      }));

      return {
        users: result?.data || [],
        totalCount: result?.meta?.totalCount ?? (result?.data || []).length,
        dateRange: result?.meta?.dateRange ?? { start: null, end: null }
      };
    },
    parameters: [
      {
        name: 'startDate',
        type: 'string',
        required: false,
        description: 'Start date filter'
      },
      {
        name: 'endDate',
        type: 'string',
        required: false,
        description: 'End date filter'
      }
    ],
    returnType: 'object',
    fullPath: 'v0.user_activity'
  };
}
