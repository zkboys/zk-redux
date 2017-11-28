export default function asyncActionCallbackMiddleware() {
    return next => action => {
        const {meta = {}, error, payload} = action;
        const {sequence = {}, onResolve, onReject} = meta;
        if (sequence.type !== 'next') return next(action);

        // do callback
        if (error) {
            if (onReject) {
                onReject(payload);
            }
        } else if (onResolve) {
            onResolve(payload);
        }

        next(action);
    };
}
