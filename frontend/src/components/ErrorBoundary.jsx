// src/components/ErrorBoundary.jsx

import { Component } from "react";
import { useTranslation } from "react-i18next";
import { withTranslation } from "react-i18next";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    const { t } = this.props;
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {t("error_boundary_title")}
          </h1>
          <p className="mb-4">{t("error_boundary_message")}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {t("error_boundary_retry")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
