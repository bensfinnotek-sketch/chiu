import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class AppErrorBoundary extends React.Component<{children:React.ReactNode},{hasError:boolean}>{
  state={hasError:false};
  static getDerivedStateFromError(){return {hasError:true};}
  componentDidCatch(error:unknown){if(import.meta.env.DEV)console.error('[Lina] UI error',error);}
  render(){if(this.state.hasError)return <div className="min-h-screen grid place-items-center bg-[var(--bg)] p-6 text-center"><div className="card max-w-md p-6"><h1 className="text-xl font-bold">Lina đang cần khởi động lại</h1><p className="mt-2 text-sm text-[var(--muted)]">Dữ liệu học đã lưu trên thiết bị. Bạn có thể tải lại trang để tiếp tục.</p><button className="btn-primary mt-5" onClick={()=>location.reload()}>Tải lại ứng dụng</button></div></div>;return this.props.children;}
}
createRoot(document.getElementById('root')!).render(<AppErrorBoundary><App /></AppErrorBoundary>);
