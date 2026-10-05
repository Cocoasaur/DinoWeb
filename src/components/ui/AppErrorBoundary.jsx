import { Component } from 'react';
import { handleAppLoadFailure } from '../../utils/loadRecovery';

export default class AppErrorBoundary extends Component {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error) {
        // Recovery UI lives outside the React root and cannot depend on a
        // missing section chunk, stylesheet or the mounted 3D renderer.
        handleAppLoadFailure(error);
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}
