import {createAction, handleActions} from 'redux-actions';
import {identity} from 'lodash/util';
import uuid from 'uuid/v4';
import actionUtils from './action-utils';
import checkAction from './check-action';
import reducerPage from './reducer-page';
import * as actionPage from './action-page';
import _handleAsyncReducer from './handle-async-reducer';

export * as actionTypes from './action-types';
export middlewareAsyncActionCallback from './middleware-async-action-callback';
export connect from './connect';
export createConnectHOC from './connect-hoc';
export const handleAsyncReducer = _handleAsyncReducer;
export middlewarePromise from './middleware-promise';
export middlewareSyncReducerToLocalStorage from './middleware-sync-reducer-to-local-storage';
export middlewareUtils from './middleware-utils';

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
 * @param syncKeys
 * @param pageInitState
 * @returns {{actions, reducers: {pageState}}}
 */
export function getActionsAndReducers({models, syncKeys, pageInitState}) {
    const utils = actionUtils({pageInitState, syncKeys});
    const pageState = reducerPage(pageInitState);
    let _actions = checkAction({actionPage, utils});
    let _reducers = {pageState};

    Object.keys(models).forEach(key => {
        const model = models[key];
        const initialState = model.initialState;
        let actions = model.actions || {};
        let reducers = model.reducers || {};
        const ar = model.ar;

        if (ar) { // 处理action reducer 合并写法
            const arActions = {};
            const arReducers = {};
            Object.keys(ar).forEach(actionName => {
                const type = uuid();
                const arValue = ar[actionName];
                if (typeof arValue === 'function') {
                    arActions[actionName] = createAction(type);
                    arReducers[type] = ar[actionName];
                } else {
                    const {payloadCreator = identity, metaCreator = identity, reducer = (state) => ({...state})} = arValue;
                    arActions[actionName] = createAction(type, payloadCreator, metaCreator);
                    arReducers[type] = reducer;
                }

            });
            reducers = {...reducers, ...arReducers};
            actions = {...actions, ...arActions};
        }


        // 处理异步reducer
        const __reducers = {};
        Object.keys(reducers).forEach(key => {
            const reducer = reducers[key];
            if (typeof reducer === 'object') {
                __reducers[key] = _handleAsyncReducer(reducer);
            } else {
                __reducers[key] = reducer;
            }
        });

        _actions[key] = actions;
        _reducers[key] = handleActions(__reducers, initialState);
    });

    return {
        actions: _actions,
        reducers: _reducers,
    }
}
