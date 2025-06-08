
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
              variant={location.pathname === '/leads' ? 'default' : 'ghost'}
              onClick={() => navigate('/leads')}
            >
              Leads
            </Button>
            <Button
              variant={location.pathname === '/negociando' ? 'default' : 'ghost'}
              onClick={() => navigate('/negociando')}
            >
              Negociando
            </Button>
            <Button
              variant={location.pathname === '/finalizados' ? 'default' : 'ghost'}
              onClick={() => navigate('/finalizados')}
            >
              Finalizados
            </Button>
            <Button
              variant={location.pathname === '/vendas' ? 'default' : 'ghost'}
              onClick={() => navigate('/vendas')}
            >
              Home
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
