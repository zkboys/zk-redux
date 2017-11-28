import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

export default function defaultConnect({actions, options}) {
    return function connectComponent(component) {
        const {
            INIT_STATE = {},
            mapStateToProps = () => ({}),
            mapDispatchToProps = (dispatch) => {
                const ac = bindActionCreators(actions, dispatch);
                Object.keys(actions).forEach(key => {
                    if (typeof actions[key] === 'object') {
                        ac[key] = bindActionCreators(actions[key], dispatch);
                    }
                });
                const PAGE_SCOPE = INIT_STATE.scope || 'commonPageScope';
                ac.setState = (pageScope, payload) => {
                    if (typeof pageScope === 'string') {
                        ac.setScopeState(pageScope, payload);
                    } else {
                        ac.setScopeState(PAGE_SCOPE, pageScope);
                    }
                };

                return {action: ac};
            },
            mergeProps,
            LayoutComponent,
        } = component;

        // 只要组件导出了mapStateToProps，就说明要与redux进行连接
        // 优先获取LayoutComponent，如果不存在，获取default
        if (mapStateToProps) {
            let com = LayoutComponent;
            if (!com) com = component.default;
            if (!com) return component;
            return connect(
                mapStateToProps,
                mapDispatchToProps,
                mergeProps,
                options
            )(com);
        }
        return LayoutComponent || component.default || component; // 如果 component有多个导出，优先LayoutComponent，其次使用默认导出
    };
}
