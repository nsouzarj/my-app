import { useState } from 'react';
import { apiService } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Building, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    orgName: '',
    orgType: 'Pessoal'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await apiService.auth.register(formData);
      if (result.success) {
        // After register, auto login
        const loginResult = await apiService.auth.login({ 
          email: formData.email, 
          password: formData.password 
        });
        login(loginResult);
        navigate('/');
      } else {
        setError(result.error || 'Falha no cadastro');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-app p-4">
      <div className="w-full max-w-md space-y-8 bg-app-card p-10 rounded-[2.5rem] border border-app shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-app-accent/50 to-transparent"></div>
        
        <div className="text-center relative">
          <h2 className="text-4xl font-black text-app-text tracking-tighter mb-2">Novo Cadastro</h2>
          <p className="text-app-text-dim text-sm font-medium">Controle suas finanças com inteligência</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-black text-app-text-dim uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-app-text-dim group-focus-within:text-app-accent transition-colors" />
                </div>
                <input
                  name="fullName"
                  required
                  className="w-full bg-app-bg border border-app text-app-text rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent transition-all font-medium"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-black text-app-text-dim uppercase tracking-widest ml-1">E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-app-text-dim group-focus-within:text-app-accent transition-colors" />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full bg-app-bg border border-app text-app-text rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent transition-all font-medium"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-black text-app-text-dim uppercase tracking-widest ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-app-text-dim group-focus-within:text-app-accent transition-colors" />
                </div>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-app-bg border border-app text-app-text rounded-2xl pl-12 pr-12 py-3 outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent transition-all font-medium placeholder:text-app-text-dim/30"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-app-text-dim hover:text-app-accent transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="pt-4 mt-6 border-t border-app">
              <label className="block text-xs font-black text-app-text-dim uppercase tracking-widest ml-1 mb-2">Detalhes da Organização</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-app-text-dim group-focus-within:text-app-accent transition-colors" />
                </div>
                <input
                  name="orgName"
                  required
                  placeholder="Nome do seu Workspace"
                  className="w-full bg-app-bg border border-app text-app-text rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-app-accent/20 focus:border-app-accent transition-all font-medium placeholder:text-app-text-dim/30"
                  value={formData.orgName}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-app-text text-app-bg hover:opacity-90 font-black py-4 px-4 rounded-[1.25rem] transition-all shadow-xl flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" className="border-app-bg border-t-app-accent" /> : 'Criar minha conta'}
            {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="pt-6 border-t border-app text-center">
          <p className="text-app-text-dim text-sm font-medium">
            Já possui acesso? <Link to="/login" className="text-app-accent hover:underline font-black ml-1 inline-flex items-center">Acesse aqui</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
