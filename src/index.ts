import express from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { http } from '@google-cloud/functions-framework';
import Joi from 'joi';

import { logger } from './logging.service';
import { MemolaCreative } from './klaviyo/account.const';
import { RunPipelineOptions, runPipeline } from './klaviyo/pipeline.service';

dayjs.extend(utc);
const app = express();

app.post('/', ({ body }, res) => {
    Joi.object<RunPipelineOptions>({
        start: Joi.string()
            .optional()
            .empty(null)
            .allow(null)
            .default(dayjs.utc().subtract(1, 'year').format('YYYY-MM-DDTHH:mm:ss')),
        end: Joi.string()
            .optional()
            .empty(null)
            .allow(null)
            .default(dayjs.utc().format('YYYY-MM-DDTHH:mm:ss')),
    })
        .validateAsync(body)
        .then((options) => {
            runPipeline(MemolaCreative, options)
                .then((result) => res.status(200).json({ result }))
                .catch((error) => {
                    logger.error(error);
                    res.status(500).json({ error });
                });
        })
        .catch((error) => {
            logger.warn(error);
            res.status(400).json({ error });
        });
});

http('main', app);
