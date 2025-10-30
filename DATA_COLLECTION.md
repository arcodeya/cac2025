# Automated Data Collection System

This application uses an automated data collection system to gather real-time wastewater surveillance data from multiple sources.

## Architecture

### Edge Functions

The system uses two Supabase Edge Functions:

1. **data-collector** - Performs the actual data collection from external sources
2. **monthly-scheduler** - Triggers automated monthly data collection runs

### Data Sources

The system attempts data collection from multiple sources in priority order:

1. **Primary Feed** - Web-based data extraction from public health dashboards
2. **Backup Feed** - CDC NWSS (National Wastewater Surveillance System) API
3. **Emergency Feed** - Manual data upload fallback (disabled by default)

### Database Tables

- `data_collection_runs` - Tracks each collection execution with metadata
- `data_source_configs` - Manages data source configurations and priorities
- `wastewater_readings` - Stores the actual surveillance data
- `sampling_sites` - Texas cities with monitoring locations
- `virus_types` - Tracked pathogens

## How It Works

### Automatic Collection

The system runs automatically on the 1st of every month:

1. The `monthly-scheduler` function checks if it should run (day 1 of month)
2. If scheduled, it triggers the `data-collector` function
3. `data-collector` tries each data source in priority order
4. Collected data is processed, validated, and inserted into the database
5. Collection metadata is logged for monitoring

### Manual Collection

You can manually trigger data collection in two ways:

1. **From the App**: Tap the "Refresh" button on the Data Freshness indicator
2. **Via API**: Call the edge function directly

```bash
# Manual trigger via API
curl -X POST \
  https://YOUR_SUPABASE_URL/functions/v1/data-collector \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Data Freshness

The app displays a data freshness indicator showing:
- Last update timestamp
- Days since last update
- Warning banner if data is stale (>30 days)
- Refresh button to manually trigger collection

## Data Processing

### Collection Flow

1. **Fetch** - Retrieve data from external source
2. **Parse** - Extract structured data from HTML/JSON
3. **Transform** - Map external data to internal schema
4. **Validate** - Check data completeness and quality
5. **Upsert** - Insert new or update existing records
6. **Log** - Record collection metadata

### Data Quality

Each collection run calculates a quality score (0-1) based on:
- Data completeness (all expected sites and viruses)
- Source reliability (primary vs fallback sources)
- Error rates during collection

Quality scores are stored with each collection run for monitoring.

## Monitoring

### Collection Status

Check the last collection run status:

```sql
SELECT
  run_date,
  status,
  records_collected,
  source_identifier,
  execution_time_ms,
  data_quality_score
FROM data_collection_runs
ORDER BY run_date DESC
LIMIT 10;
```

### Data Source Health

Monitor data source performance:

```sql
SELECT
  source_name,
  is_active,
  last_successful_run,
  consecutive_failures,
  priority
FROM data_source_configs
ORDER BY priority;
```

## Troubleshooting

### No Data Collected

If a collection run returns zero records:

1. Check `data_collection_runs` table for error details
2. Verify data source is accessible (not blocked or changed)
3. Check `consecutive_failures` count in `data_source_configs`
4. Fallback sources may have activated automatically

### Stale Data Warning

If the app shows a stale data warning:

1. Tap the Refresh button to manually trigger collection
2. Check if the last scheduled run failed
3. Verify edge functions are deployed and accessible
4. Review error logs in `data_collection_runs`

### Collection Failures

Common failure reasons:

- **Network Issues** - Temporary connectivity problems
- **Source Changes** - External website structure changed
- **Rate Limiting** - Too many requests to external source
- **Data Format** - Unexpected data structure from source

The system automatically tries backup sources when the primary source fails.

## Security & Privacy

### Data Handling

- All data collected is from public health sources
- No personal health information is collected
- Data is anonymized at the source level
- Only aggregate wastewater measurements are stored

### Access Control

- Edge functions use service role key for database writes
- Mobile app uses anon key for read-only access
- Row Level Security (RLS) policies protect data integrity
- Collection metadata is publicly readable for transparency

### Source Identification

Data sources are identified generically in the code:
- "primary_feed" instead of actual URLs
- "backup_feed" for alternative sources
- Configuration stored in encrypted JSONB fields

## Maintenance

### Updating Collection Logic

If external sources change their data format:

1. Update the parsing logic in `data-collector` edge function
2. Test with the current source structure
3. Deploy updated function via Supabase dashboard
4. Monitor next collection run for success

### Adding New Sources

To add a new data source:

1. Insert configuration into `data_source_configs` table
2. Add collection logic to `data-collector` function
3. Set appropriate priority level
4. Test manual collection before enabling

### Scheduling Changes

The monthly schedule is controlled in `monthly-scheduler`:

- Current: Runs on day 1 of each month
- To change: Modify the `dayOfMonth` check
- Can be triggered manually with `X-Force-Run: true` header

## API Reference

### Data Collector Endpoint

```
POST /functions/v1/data-collector
```

Response:
```json
{
  "success": true,
  "recordsCollected": 45,
  "source": "primary_feed",
  "executionTime": 3542
}
```

### Monthly Scheduler Endpoint

```
POST /functions/v1/monthly-scheduler
Content-Type: application/json

{
  "schedulerKey": "your-secret-key"
}
```

Response:
```json
{
  "success": true,
  "triggered": true,
  "collectionResult": { ... },
  "timestamp": "2025-10-30T00:00:00.000Z"
}
```

## Environment Variables

The edge functions automatically have access to:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database writes
- `SUPABASE_ANON_KEY` - Anonymous key for public access

No manual configuration needed - these are pre-configured by Supabase.

## Support

For issues with data collection:

1. Check the collection run logs in the database
2. Review error details in `data_collection_runs.error_details`
3. Verify edge functions are deployed and running
4. Contact the development team with specific error messages

---

**Note**: This system is designed for public health monitoring using publicly available data sources. All data collection complies with source terms of service and usage policies.
