import { MemolaCreative } from './account.const';
import { runPipeline } from './pipeline.service';

it('run-pipeline', async () => {
    return runPipeline(MemolaCreative, { start: '2023-01-01T00:00:00', end: '2023-08-01T00:00:00' })
        .then((data) => expect(data).toBeTruthy())
        .catch((error) => {
            console.log(error);
            throw error;
        });
});
