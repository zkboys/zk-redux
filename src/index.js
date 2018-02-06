import {createAction, handleActions} from 'redux-actions';
import {identity} from 'lodash/util';
import actionUtils from './action-utils';
import checkAction from './check-action';
import reducerPage from './reducer-page';
import * as actionPage from './action-page';
import _handleAsyncReducer from './handle-async-reducer';
import * as _actionTypes from './action-types';

export middlewareAsyncActionCallback from './middleware-async-action-callback';
export connect from './connect';
export createConnectHOC from './connect-hoc';
export middlewarePromise from './middleware-promise';
export middlewareSyncReducerToLocalStorage from './middleware-sync-reducer-to-local-storage';
export middlewareUtils from './middleware-utils';

export const actionTypes = _actionTypes;
export const handleAsyncReducer = _handleAsyncReducer;

let _handleError = ({error, errorTip}) => {
    console.error(error);
    if (errorTip) {
        alert(errorTip);
    }
};

let _handleSuccess = ({successTip}) => {
    if (successTip) alert(successTip);
};

let _storage = window.localStorage;

export function init({storage, handleError, handleSuccess}) {
    if (handleError) _handleError = handleError;
    if (storage) _storage = storage;
    if (handleSuccess) _handleSuccess = handleSuccess;
}

export function getHandleSuccess() {
    return _handleSuccess;
}

export function getHandleError() {
    return _handleError;
}

export function getStorage() {
    return _storage;
}

/**
 * 获取并整合 actions reducers
 * @param models
 * @param pageInitState
 * @returns {{actions, reducers: {pageState}}}
 */
export function getActionsAndReducers({models, pageInitState}) {
    const syncKeys = Object.keys(models).filter(key => {
        const {syncState} = models[key];
        return !!syncState;
    });

    const utils = actionUtils({pageInitState, syncKeys});
    const pageState = reducerPage(pageInitState);
    let _actions = checkAction({actionPage, utils});
    let _reducers = {pageState};

    Object.keys(models).forEach(modelName => {
        const model = models[modelName];
        let {
            initialState = {},
            syncState,
            actions = {},
            reducers = {},
        } = model;

        // 处理action reducer 合并写法
        // 除去'initialState', 'syncState', 'actions', 'reducers'等约定属性，其他都视为actions与reducers合并写法
        const ar = {};
        Object.keys(model).forEach(item => {
            if (['initialState', 'syncState', 'actions', 'reducers'].indexOf(item) === -1) {
                ar[item] = model[item];
            }
        });

        const arActions = {};
        const arReducers = {};
        Object.keys(ar).forEach((actionName, index) => {
            const type = `${modelName}-${index}-${actionName}-type`.toUpperCase(); // 保证唯一并增强type可读性，方便调试；
            const arValue = ar[actionName];

            if (typeof arValue === 'function') { // ar 函数写法
                arActions[actionName] = createAction(type);
                arReducers[type] = ar[actionName];
            } else { // ar 对象写法
                let {payload = identity, meta, reducer = (state) => ({...state})} = arValue;

                // 处理meta默认值
                if (!meta) {
                    if (payload && typeof payload.then === 'function') { // is promise
                        meta = commonAsyncMeta; // 异步默认meta
                    } else {
                        meta = identity; // 非异步默认 meta
                    }
                }

                let metaCreator = meta;
                let payloadCreator = payload;

                // 非函数时，处理
                if (typeof payloadCreator !== 'function') payloadCreator = () => payload;
                if (typeof metaCreator !== 'function') metaCreator = () => meta;

                arActions[actionName] = createAction(type, payloadCreator, metaCreator);
                arReducers[type] = reducer;
            }

        });

        reducers = {...reducers, ...arReducers};
        actions = {...actions, ...arActions};

        // 处理reducer
        const __reducers = {};
        Object.keys(reducers).forEach(key => {
            const reducer = reducers[key];

            if (typeof reducer === 'object') {
                // 对象写法 视为异步reducer
                // _handleAsyncReducer内部对新、旧state自动进行了合并，异步reducer各个函数（padding、resolve等）只需要返回新数据即可
                __reducers[key] = _handleAsyncReducer(reducer);
            } else {
                // 函数视为普通reducer, 进行新、旧state合并，model中的reducer只返回新数据即可
                __reducers[key] = (state, action) => {
                    const newState = reducer(state, action) || {}; // 允许reducer不返回数据

                    return {
                        ...state,
                        ...newState,
                    };
                };
            }
        });

        if (syncState) {
            // 为meta添加__model_sync_name 和 __model_sync_state 属性，同步中间件会用到
            Object.keys(actions).forEach(item => {
                const actionCreator = actions[item];
                actions[item] = (...args) => {
                    const action = actionCreator(...args);
                    action.meta = action.meta === void 0 ? {} : action.meta;
                    if (typeof action.meta !== 'object') throw new Error(`when model has syncState property，meta must be an object! check ${modelName} ${item} action method`);

                    action.meta.__model_sync_name = modelName;
                    action.meta.__model_sync_state = syncState;

                    return action;
                };
            });

            // 从 store中恢复数据的reducer 如果为定义，使用默认reducers
            if (!__reducers[actionTypes.GET_STATE_FROM_STORAGE]) {
                __reducers[actionTypes.GET_STATE_FROM_STORAGE] = (state, action) => {
                    const {payload = {}} = action;
                    const data = payload[modelName] || {};
                    return {...state, ...data};
                };
            }
        }
        _actions[modelName] = actions;
        _reducers[modelName] = handleActions(__reducers, initialState);
    });

    return {
        actions: _actions,
        reducers: _reducers,
    }
}


/**
 * 通用异步Meta处理，默认启用errorTip，禁用successTip，onResolve，onReject回调
 * @param successTip
 * @param errorTip
 * @param onResolve
 * @param onReject
 * @param onComplete
 * @returns {{successTip: boolean, errorTip, onResolve: *, onReject: *, onComplete: *}}
 */
export function commonAsyncMeta({
                                    successTip = false,
                                    errorTip,
                                    onResolve,
                                    onReject,
                                    onComplete,
                                }) {
    return {
        successTip,
        errorTip,
        onResolve,
        onReject,
        onComplete,
    }
}

export const __DO_NOT_USE__ActionTypes = _actionTypes;
