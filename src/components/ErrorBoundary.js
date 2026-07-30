"use client";

import { Component } from "react";
import { AlertTriangle } from "lucide-react";

// React error boundary. Error boundaries must be class components — there is no
// hook equivalent.
//
// Used to isolate the CV renderer: a single malformed record should degrade to
// a polite message in place of the preview, never take down the surrounding
// page (the admin dashboard, or the builder the user is mid-way through).
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Render error caught by boundary:", error, info?.componentStack);
    this.props.onError?.(error);
  }

  componentDidUpdate(prevProps) {
    // Recover automatically once the offending input changes — otherwise the
    // user would have to reload the page after fixing a bad field.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-6 py-12 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <h3 className="mt-3 font-display text-base font-bold text-amber-800">
          {this.props.title || "This content could not be displayed"}
        </h3>
        <p className="mt-1 max-w-xs text-sm text-amber-700">
          {this.props.message ||
            "Something in this data could not be rendered. Editing the affected fields usually fixes it."}
        </p>
      </div>
    );
  }
}
