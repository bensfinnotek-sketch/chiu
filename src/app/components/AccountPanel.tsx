import { useEffect, useState } from 'react';
import { authService } from '../services/auth';

export function AccountPanel() {
  const [session, setSession] = useState<any>(null);
  const [mode, setMode] = useState<'sign-in'|'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    void authService.getSession().then(value => { if (mounted) setSession(value); });
    return authService.onAuthStateChange(next => { if (mounted) setSession(next); });
  }, []);

  const submit = async () => {
    setBusy(true); setMessage('');
    try {
      if (mode === 'sign-in') await authService.signIn(email.trim(), password);
      else await authService.signUp(email.trim(), password, displayName.trim());
      setMessage(mode === 'sign-in' ? 'Đăng nhập thành công.' : 'Tài khoản đã tạo. Nếu bật xác nhận email, hãy kiểm tra hộp thư.');
    } catch (error: any) {
      setMessage(error?.message || 'Không thể thực hiện yêu cầu.');
    } finally { setBusy(false); }
  };

  if (!authService.configured) {
    return <section className="card p-5 sm:p-6"><h2 className="text-xl font-bold">Tài khoản</h2><p className="mt-2 text-sm text-[var(--muted)]">Chế độ local/demo đang hoạt động. Khi cấu hình Supabase Auth + Database, tài khoản và tiến trình sẽ đồng bộ qua backend.</p></section>;
  }

  if (session?.user) {
    const name = session.user.user_metadata?.display_name || session.user.email || 'Learner';
    return <section className="card p-5 sm:p-6">
      <h2 className="text-xl font-bold">Tài khoản</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{name} · {session.user.email}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={() => void authService.signOut()}>Đăng xuất</button>
        <button className="btn-secondary" onClick={async () => { if (window.confirm('Xóa tài khoản và toàn bộ dữ liệu học tập?')) { setBusy(true); setMessage(''); try { await authService.deleteAccount(); setMessage('Tài khoản đã được xóa.'); } catch (e:any) { setMessage(e?.message || 'Không thể xóa tài khoản.'); } finally { setBusy(false); } } }} disabled={busy}>Xóa tài khoản</button>
      </div>
      {message && <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>}
    </section>;
  }

  return <section className="card p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-bold">Tài khoản</h2><p className="mt-1 text-sm text-[var(--muted)]">Đồng bộ tiến trình giữa thiết bị khi backend được cấu hình.</p></div><div className="flex gap-2"><button className={`toggle-chip ${mode==='sign-in'?'active':''}`} onClick={() => setMode('sign-in')}>Đăng nhập</button><button className={`toggle-chip ${mode==='sign-up'?'active':''}`} onClick={() => setMode('sign-up')}>Tạo tài khoản</button></div></div>
    {mode === 'sign-up' && <input className="mt-4 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" placeholder="Tên hiển thị" value={displayName} onChange={e=>setDisplayName(e.target.value)} />}
    <input className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
    <input className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" type="password" placeholder="Mật khẩu" value={password} onChange={e=>setPassword(e.target.value)} />
    <div className="mt-4 flex flex-wrap gap-2">
      <button className="btn-primary" onClick={() => void submit()} disabled={busy}>{mode==='sign-in'?'Đăng nhập':'Tạo tài khoản'}</button>
      <button className="btn-secondary" onClick={() => void authService.signInWithGoogle().catch((e:any)=>setMessage(e?.message || 'Google login chưa sẵn sàng.'))}>Google</button>
      <button className="btn-secondary" onClick={async()=>{try{await authService.resetPassword(email.trim());setMessage('Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.');}catch(e:any){setMessage(e?.message||'Không thể gửi email.');}}}>Quên mật khẩu</button>
    </div>
    {message && <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>}
  </section>;
}
