import * as types from './action-types';

export function setScopeState(pageScope, payload) {
    return {
        type: types.SET_STATE,
        pageScope,
        payload,
    };
}

