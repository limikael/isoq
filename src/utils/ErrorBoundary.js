import { Component } from "preact";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  render(_, state) {
    if (state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}