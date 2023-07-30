import { Readable } from 'node:stream';
import axios, { AxiosInstance } from 'axios';
import axiosThrottle from 'axios-request-throttle';
import { zip } from 'lodash';

import { logger } from '../logging.service';

export const getClient = (apiKey: string) => {
    const revision = '2023-07-15';

    const client = axios.create({
        baseURL: 'https://a.klaviyo.com/api',
        headers: { revision, Authorization: `Klaviyo-API-Key ${apiKey}` },
    });

    axiosThrottle.use(client, { requestsPerSecond: 3 });

    return client;
};

export type QueryMetricAggregateConfig = {
    id: string;
    name: string;
    by: [string, string];
};

export type QueryMetricAggregateOptions = {
    start: string;
    end: string;
};

type QueryMetricAggregateResponse = {
    data: {
        attributes: {
            dates: string[];
            data: {
                dimensions: [string, string];
                measurements: {
                    [key: string]: number[];
                };
            }[];
        };
    };
    links: {
        self: string;
        prev: string | null;
        next: string | null;
    };
};

export const queryMetricAggregate = (
    client: AxiosInstance,
    { id, name, by }: QueryMetricAggregateConfig,
    { start, end }: QueryMetricAggregateOptions,
) => {
    const stream = new Readable({ objectMode: true, read: () => {} });

    const _get = (cursor?: string) => {
        client
            .request<QueryMetricAggregateResponse>({
                method: 'POST',
                url: '/metric-aggregates/',
                // params: { 'page[cursor]': cursor },
                data: {
                    data: {
                        type: 'metric-aggregate',
                        attributes: {
                            by,
                            measurements: ['count', 'sum_value'],
                            filter: [
                                `greater-or-equal(datetime,${start})`,
                                `less-than(datetime,${end})`,
                            ],
                            metric_id: id,
                            interval: 'day',
                            page_size: 500,
                            page_cursor: cursor,
                        },
                    },
                },
            })
            .then(({ data }) => data)
            .then(({ data, links }) => {
                data.attributes.data
                    .flatMap(({ dimensions, measurements }) => {
                        return Object.entries(measurements).flatMap(([measurement, values]) => {
                            return zip(data.attributes.dates, values)
                                .filter(([_, value]) => value ?? 0 > 0)
                                .map(([date, value]) => ({
                                    id,
                                    name,
                                    flow: dimensions[0],
                                    message: dimensions[1],
                                    measurement,
                                    value: value?.toFixed(6),
                                    date,
                                }));
                        });
                    })
                    .forEach((row) => stream.push(row));

                if (links.next) {
                    const cursor = new URL(links.next).searchParams.get('page[cursor]') as string;
                    _get(cursor);
                    return;
                }

                stream.push(null);
            })
            .catch((error) => {
                if (axios.isAxiosError(error)) {
                    logger.error(error.response?.data);
                }
                stream.emit('error', error);
            });
    };

    _get();

    return stream;
};
