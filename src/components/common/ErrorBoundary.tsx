import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI boundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#201A17] border border-red-200 dark:border-red-900/50 shadow-xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-black text-[#211A17] dark:text-white">
              Đã xảy ra sự cố không mong muốn
            </h2>
            <p className="text-xs text-[#716761] dark:text-[#A89E97]">
              Phần này của ứng dụng đang gặp lỗi. Bạn có thể thử lại hoặc tải lại trang nếu lỗi vẫn tiếp diễn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-5 py-2.5 rounded-xl bg-[#E86F51] hover:bg-[#d85f41] text-white text-xs font-bold shadow-md shadow-[#E86F51]/25 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>Thử lại</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-white dark:bg-[#181412] border border-[#E86F51]/20 text-[#716761] dark:text-[#D9D0CA] text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>Tải lại trang</span>
              </button>
            </div>
            {import.meta.env.DEV && this.state.error?.message && (
              <details className="text-left text-[11px] text-[#716761] dark:text-[#A89E97]">
                <summary className="cursor-pointer font-bold">Chi tiết kỹ thuật</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.message}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
