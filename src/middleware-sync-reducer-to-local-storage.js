import {isFSA} from 'flux-standard-action';
import * as types from './action-types';
import {getStorage} from './index';


/**
 * 根据 mapObj 的结构，获取 originObj 对应结构的数据
 * @param originObj
 * @param mapObj
 * @param result
 * @returns {{}}
 */
function filterObjectByObject(originObj, mapObj = {}, result = {}) {
    Object.keys(mapObj).forEach(key => {
        const value = mapObj[key];
        if (value === true) {
            result[key] = originObj[key];
        }

        if (typeof value === 'object') {
            result[key] = filterObjectByObject(originObj[key], value, result[key]);
        }
    });
    return result;
}

function syncToStorage(key, state) {
    const {sync} = state;
    const Storage = getStorage();
    // 根据 sync结构 获取 state中对应的数据，sync === true 获取state中所有数据
    const data = sync === true ? state : filterObjectByObject(state, sync);
    Storage.setItem(key, data);
}

export default ({dispatch, getState}) => next => action => {
    setTimeout(() => { // 使getState获取到更新后的state
        let pageState = getState().pageState;
        if (pageState) {
            Object.keys(pageState).forEach(key => {
                const state = pageState[key];
                if (state && state.sync) {
                    syncToStorage(key, state);
                }
            });
        }
    });

    if (!isFSA(action)) {
        return next(action);
    }
    const {meta = {}, sequence = {}, error, payload} = action;
    const {__model_sync_name} = meta;

    if (action.type === types.SYNC_STATE_TO_STORAGE) {
        let state = getState();
        syncToStorage(payload, state[payload]);
    }

    if (!__model_sync_name || sequence.type === 'start' || error) {
        return next(action);
    }

    next(action);

    setTimeout(() => {
        dispatch({
            type: types.SYNC_STATE_TO_STORAGE,
            payload: __model_sync_name,
        });
    }, 16);
};
