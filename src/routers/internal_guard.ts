import _ from 'the-lodash';
import { Promise } from 'the-promise';
import { Context } from '../context';
import { Router } from '@kubevious/helper-backend';

export default function (router: Router, context: Context) {
    router.url('/api/internal/guard');

    router.post<{}, ChangeIdBody>('/process_job', (req, res) => {

        return Promise.resolve()
            .then(() => context.validationScheduler.processJobs())
    });
}

export interface ChangeIdBody {
    change_id: string;
}