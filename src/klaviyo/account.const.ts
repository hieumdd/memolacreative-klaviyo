import { QueryMetricAggregateConfig } from './klaviyo.service';

export type Account = {
    name: string;
    apiKey: string;
    configs: QueryMetricAggregateConfig[];
};

export const MemolaCreative: Account = {
    name: 'MemolaCreative',
    apiKey: process.env.MEMOLACREATIVE_KLAVIYO_API_KEY ?? '',
    configs: [
        { name: 'Clicked Email', id: 'M9AG7W', by: ['$flow', '$message'] },
        { name: 'Opened Email', id: 'KTyASG', by: ['$flow', '$message'] },
        { name: 'Placed Order', id: 'HDnbsn', by: ['$attributed_flow', '$attributed_message'] },
        { name: 'Received Email', id: 'MFYupb', by: ['$flow', '$message'] },
        { name: 'Unsubscribed', id: 'JnUYwV', by: ['$flow', '$message'] },
    ],
};
