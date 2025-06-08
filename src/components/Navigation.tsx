
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={location.pathname === '/' ? 'default' : 'ghost'}
              onClick={() => navigate('/')}
            >
              Cadastrar Leads
            </Button>
            <Button
              variant={location.pathname === '/gerenciar' ? 'default' : 'ghost'}
              onClick={() => navigate('/gerenciar')}
            >
              Gerenciar Leads
            </Button>
            <Button
              variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
            <Button
              variant={location.pathname === '/vendas' ? 'default' : 'ghost'}
              onClick={() => navigate('/vendas')}
            >
              Dashboard de Vendas
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
