import {getHandleError, getHandleSuccess} from './index';

export default function utilsMiddleware() {
    return next => action => {
        const handleError = getHandleError();
        const handleSuccess = getHandleSuccess();
        const {payload, error, meta = {}} = action;
        const {sequence = {}, successTip, errorTip = '未知系统错误'} = meta;
        // error handle
        if (errorTip && error) {
            handleError({
                error: payload,
                errorTip,
            });
        }
        if (sequence.type === 'next' && !error && successTip) {
            handleSuccess({successTip});
        }
        next(action);
    };
}
