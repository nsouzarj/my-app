import { useState } from 'react';
import { apiService } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ChevronRight, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { webauthn } from '../lib/webauthn';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await apiService.auth.login({ email, password });
      if (result.success) {
        login(result);
        navigate('/');
      } else {
        setError(result.error || 'Falha no login');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!webauthn.isSupported()) {
      setError('Seu navegador não suporta biometria ou você não tem um dispositivo configurado.');
      return;
    }

    setBiometricLoading(true);
    setError('');

    try {
      // 1. Obter desafio do servidor
      const challengeData = await apiService.auth.webauthn.getChallenge();
      if (!challengeData.success) {
        throw new Error(challengeData.error || 'Falha ao obter desafio');
      }

      // 2. Autenticar no navegador
      const credential = await webauthn.authenticate(challengeData.challenge);

      // 3. Verificar no servidor
      const result = await apiService.auth.webauthn.login(credential);
      
      if (result.success) {
        login(result);
        navigate('/');
      } else {
        setError(result.error || 'Falha na autenticação biométrica');
      }
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') { // Ignorar se o usuário cancelou
        setError('Erro na biometria: ' + (err.message || 'Tente novamente'));
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-app p-4">
      <div className="w-full max-w-md space-y-8 bg-app-card p-10 rounded-[2.5rem] border border-app shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-app-accent/50 to-transparent"></div>
        
        <div className="text-center relative">
          <h2 className="text-4xl font-black text-app-text tracking-tighter mb-2">Login</h2>
          <p className="text-app-text-dim text-sm font-medium">Continue sua jornada financeira</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-black text-app-text-dim uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-app-text-dim group-focus-within:text-app-accent transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full bg-app-bg border border-app text-app-text rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent transition-all font-medium placeholder:text-app-text-dim/30"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black text-app-text-dim uppercase tracking-widest ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-app-text-dim group-focus-within:text-app-accent transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-app-bg border border-app text-app-text rounded-2xl pl-12 pr-12 py-4 outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent transition-all font-medium placeholder:text-app-text-dim/30"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-app-text-dim hover:text-app-accent transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="flex justify-end pr-1">
                <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-wider text-app-text-dim hover:text-app-accent transition-colors">Esqueceu sua senha?</Link>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-app-text text-app-bg hover:opacity-90 font-black py-4 px-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" className="border-app-bg border-t-app-accent" /> : 'Acessar Conta'}
            {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-app"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-app-card px-2 text-app-text-dim font-black">ou</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={biometricLoading || loading}
            className="w-full bg-app-bg border border-app text-app-text hover:border-app-accent hover:text-app-accent font-black py-4 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {biometricLoading ? <LoadingSpinner size="sm" className="border-app-text border-t-app-accent" /> : <Fingerprint className="w-5 h-5" />}
            {biometricLoading ? 'Aguardando biometria...' : 'Entrar com Digital'}
          </button>
        </form>

        <div className="pt-6 border-t border-app text-center">
          <p className="text-app-text-dim text-sm font-medium">
            Ainda não tem acesso? <Link to="/register" className="text-app-accent hover:underline font-black ml-1 inline-flex items-center">Crie sua conta aqui</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
