import {handleActions} from 'redux-actions';
import {cloneDeep} from 'lodash/lang';
import * as types from './action-types';

export default function (initialState) {
    return handleActions({
        [types.SET_STATE](state, action) {
            const {pageScope, payload} = action;
            const newState = cloneDeep(state);
            const newPayload = cloneDeep(payload);
            return {
                ...newState,
                [pageScope]: {...(newState[pageScope]), ...newPayload},
            };
        },
        [types.GET_STATE_FROM_STORAGE](state, action) {
            const {payload} = action;
            const newState = cloneDeep(state);
            if (payload) {
                Object.keys(payload).forEach(key => {
                    if (initialState && initialState[key] && payload[key]) {
                        newState[key] = payload[key];
                    }
                });
            }
            return {
                ...state,
                ...newState,
            };
        },
    }, initialState);
}
