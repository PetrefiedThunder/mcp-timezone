#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "mcp-timezone", version: "1.0.0" });

server.tool("convert_time", "Convert time between timezones.", {
  time: z.string().describe("Time to convert (ISO 8601, e.g. '2025-03-15T14:30:00')"),
  fromTimezone: z.string().describe("Source timezone (e.g. 'America/New_York', 'UTC', 'Asia/Tokyo')"),
  toTimezone: z.string().describe("Target timezone"),
}, async ({ time, fromTimezone, toTimezone }) => {
  const date = new Date(time.includes("T") && !time.includes("Z") && !time.includes("+") && !time.includes("-", 11)
    ? `${time}` : time);
  // Format in both timezones
  const fromStr = date.toLocaleString("en-US", { timeZone: fromTimezone, dateStyle: "full", timeStyle: "long" });
  const toStr = date.toLocaleString("en-US", { timeZone: toTimezone, dateStyle: "full", timeStyle: "long" });
  const fromOffset = getOffset(date, fromTimezone);
  const toOffset = getOffset(date, toTimezone);
  return { content: [{ type: "text" as const, text: JSON.stringify({
    from: { timezone: fromTimezone, time: fromStr, utcOffset: fromOffset },
    to: { timezone: toTimezone, time: toStr, utcOffset: toOffset },
    iso: date.toISOString(),
  }, null, 2) }] };
});

server.tool("get_current_time", "Get current time in one or more timezones.", {
  timezones: z.array(z.string()).describe("List of timezone names (e.g. ['America/Los_Angeles', 'Europe/London'])"),
}, async ({ timezones }) => {
  const now = new Date();
  const results = timezones.map((tz) => ({
    timezone: tz,
    time: now.toLocaleString("en-US", { timeZone: tz, dateStyle: "full", timeStyle: "long" }),
    utcOffset: getOffset(now, tz),
  }));
  return { content: [{ type: "text" as const, text: JSON.stringify({ utc: now.toISOString(), timezones: results }, null, 2) }] };
});

server.tool("time_difference", "Calculate the time difference between two timezones.", {
  timezone1: z.string(),
  timezone2: z.string(),
}, async ({ timezone1, timezone2 }) => {
  const now = new Date();
  const off1 = getOffsetMinutes(now, timezone1);
  const off2 = getOffsetMinutes(now, timezone2);
  const diffMin = off2 - off1;
  const hours = Math.floor(Math.abs(diffMin) / 60);
  const mins = Math.abs(diffMin) % 60;
  const sign = diffMin >= 0 ? "+" : "-";
  return { content: [{ type: "text" as const, text: JSON.stringify({
    timezone1, timezone2,
    difference: `${sign}${hours}h${mins > 0 ? ` ${mins}m` : ""}`,
    differenceMinutes: diffMin,
    currentTime1: now.toLocaleString("en-US", { timeZone: timezone1, timeStyle: "short" }),
    currentTime2: now.toLocaleString("en-US", { timeZone: timezone2, timeStyle: "short" }),
  }, null, 2) }] };
});

server.tool("is_business_hours", "Check if it's currently business hours in a timezone.", {
  timezone: z.string(),
  startHour: z.number().min(0).max(23).default(9),
  endHour: z.number().min(0).max(23).default(17),
}, async ({ timezone, startHour, endHour }) => {
  const now = new Date();
  const hour = parseInt(now.toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false }));
  const dayOfWeek = now.toLocaleString("en-US", { timeZone: timezone, weekday: "long" });
  const isWeekend = dayOfWeek === "Saturday" || dayOfWeek === "Sunday";
  const isBusinessHours = !isWeekend && hour >= startHour && hour < endHour;
  return { content: [{ type: "text" as const, text: JSON.stringify({
    timezone, isBusinessHours, currentHour: hour, dayOfWeek, isWeekend,
    businessHours: `${startHour}:00-${endHour}:00`,
    currentTime: now.toLocaleString("en-US", { timeZone: timezone, dateStyle: "full", timeStyle: "short" }),
  }, null, 2) }] };
});

server.tool("list_timezones", "List common timezone names by region.", {
  region: z.string().optional().describe("Filter by region (e.g. 'America', 'Europe', 'Asia', 'Pacific')"),
}, async ({ region }) => {
  const zones = Intl.supportedValuesOf("timeZone");
  const filtered = region ? zones.filter((z) => z.toLowerCase().startsWith(region.toLowerCase())) : zones;
  return { content: [{ type: "text" as const, text: JSON.stringify({ count: filtered.length, timezones: filtered }, null, 2) }] };
});

function getOffset(date: Date, tz: string): string {
  const mins = getOffsetMinutes(date, tz);
  const sign = mins >= 0 ? "+" : "-";
  const h = String(Math.floor(Math.abs(mins) / 60)).padStart(2, "0");
  const m = String(Math.abs(mins) % 60).padStart(2, "0");
  return `${sign}${h}:${m}`;
}

function getOffsetMinutes(date: Date, tz: string): number {
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = date.toLocaleString("en-US", { timeZone: tz });
  return (new Date(tzStr).getTime() - new Date(utcStr).getTime()) / 60000;
}

async function main() { const t = new StdioServerTransport(); await server.connect(t); }
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
