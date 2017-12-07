// common action type

export const SET_STATE = '@@zk-redux/SET_STATE' + Math.random().toString(36).substring(7).split('').join('.');

// middleware
export const SYNC_STATE_TO_STORAGE = '@@zk-redux/SYNC_STATE_TO_STORAGE' + Math.random().toString(36).substring(7).split('').join('.');
export const GET_STATE_FROM_STORAGE = '@@zk-redux/GET_STATE_FROM_STORAGE' + Math.random().toString(36).substring(7).split('').join('.');
