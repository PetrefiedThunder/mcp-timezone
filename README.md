# mcp-timezone

Convert times between timezones, check business hours, and calculate time differences.

> **Free API** — No API key required.

## Tools

| Tool | Description |
|------|-------------|
| `convert_time` | Convert time between timezones. |
| `get_current_time` | Get current time in one or more timezones. |
| `time_difference` | Calculate the time difference between two timezones. |
| `is_business_hours` | Check if it's currently business hours in a timezone. |
| `list_timezones` | List common timezone names by region. |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-timezone.git
cd mcp-timezone
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "timezone": {
      "command": "node",
      "args": ["/path/to/mcp-timezone/dist/index.js"]
    }
  }
}
```

## Usage with npx

```bash
npx mcp-timezone
```

## License

Apache-2.0
