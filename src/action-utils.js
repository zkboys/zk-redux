import {createAction} from 'redux-actions';
import * as types from './action-types';
import {getStorage} from './index';


export default function ({pageInitState, syncKeys = []}) {
    return {
        // 同步本地数据到state中，一般在项目启动时，会调用此action进行同步。各个模块的reducer要对应的函数处理同步逻辑
        getStateFromStorage: createAction(types.GET_STATE_FROM_STORAGE, () => {
            if (pageInitState) {
                syncKeys = syncKeys.concat(Object.keys(pageInitState).map(key => {
                    if (pageInitState[key] && pageInitState[key].syncState) {
                        return key;
                    }
                    return null;
                }));
            }
            const Storage = getStorage();
            return Storage.multiGet(syncKeys);
        }, (onResolve, onReject) => {
            return {
                onResolve,
                onReject,
            };
        }),
    };
}
