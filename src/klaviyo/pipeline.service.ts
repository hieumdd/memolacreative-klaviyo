import { pipeline } from 'node:stream/promises';
import MultiStream from 'multistream';
import ndjson from 'ndjson';

import { createLoadStream } from '../bigquery.service';
import { Account } from './account.const';
import { getClient, queryMetricAggregate } from './klaviyo.service';

export type RunPipelineOptions = {
    start: string;
    end: string;
};

export const runPipeline = async (account: Account, options: RunPipelineOptions) => {
    const client = getClient(account.apiKey);

    const stream = new MultiStream(
        account.configs.map((config) => queryMetricAggregate(client, config, options)),
        { objectMode: true },
    );

    return pipeline(
        stream,
        ndjson.stringify(),
        createLoadStream({
            table: `MetricAggregate`,
            schema: [
                { name: 'id', type: 'STRING' },
                { name: 'name', type: 'STRING' },
                { name: 'measurement', type: 'STRING' },
                { name: 'date', type: 'TIMESTAMP' },
                { name: 'flow', type: 'STRING' },
                { name: 'message', type: 'STRING' },
                { name: 'value', type: 'NUMERIC' },
            ],
        }),
    ).then(() => true);
};
