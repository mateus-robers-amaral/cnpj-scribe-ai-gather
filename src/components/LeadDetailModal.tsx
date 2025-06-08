
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Phone, MapPin, FileText } from 'lucide-react';

interface Lead {
  id: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string | null;
  endereco: string | null;
  status: string | null;
  data_criacao: string | null;
}

interface Validacao {
  id: string;
  resultado: string | null;
  credibilidade: number | null;
  cnaes_compatíveis: boolean | null;
  data_validacao: string | null;
}

interface Negociacao {
  id: string;
  status: string | null;
  data_status: string | null;
}

interface Finalizado {
  id: string;
  data_ultima_compra: string | null;
}

interface DetailedLead extends Lead {
  validacoes: Validacao[];
  negociacoes: Negociacao[];
  finalizados: Finalizado[];
}

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: DetailedLead | null;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ isOpen, onClose, lead }) => {
  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case 'novo': return 'bg-blue-100 text-blue-800';
      case 'em_validacao': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Lead</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Informações Básicas</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Nome Fantasia:</strong> {lead.nome_fantasia}</div>
                <div><strong>CNPJ:</strong> {lead.cnpj}</div>
                <div><strong>Telefone:</strong> {lead.telefone || 'Não informado'}</div>
                <div><strong>Status:</strong> 
                  <Badge className={`ml-2 ${getStatusBadgeColor(lead.status)}`}>
                    {lead.status || 'Não informado'}
                  </Badge>
                </div>
                <div><strong>Data de Criação:</strong> {lead.data_criacao ? new Date(lead.data_criacao).toLocaleDateString('pt-BR') : 'Não informado'}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Endereço</h3>
              <div className="flex items-start text-sm">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{lead.endereco || 'Não informado'}</span>
              </div>
            </div>
          </div>

          {/* Validações */}
          {lead.validacoes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Validações
              </h3>
              <div className="space-y-3">
                {lead.validacoes.map((validacao) => (
                  <Card key={validacao.id} className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><strong>Resultado:</strong> {validacao.resultado || 'Não informado'}</div>
                      <div><strong>Credibilidade:</strong> {validacao.credibilidade || 'Não informado'}</div>
                      <div><strong>CNAEs Compatíveis:</strong> {validacao.cnaes_compatíveis ? 'Sim' : 'Não'}</div>
                      <div><strong>Data:</strong> {validacao.data_validacao ? new Date(validacao.data_validacao).toLocaleDateString('pt-BR') : 'Não informado'}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Negociações */}
          {lead.negociacoes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Negociações</h3>
              <div className="space-y-3">
                {lead.negociacoes.map((negociacao) => (
                  <Card key={negociacao.id} className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><strong>Status:</strong> {negociacao.status || 'Não informado'}</div>
                      <div><strong>Data:</strong> {negociacao.data_status ? new Date(negociacao.data_status).toLocaleDateString('pt-BR') : 'Não informado'}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Finalizados */}
          {lead.finalizados.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Finalizações</h3>
              <div className="space-y-3">
                {lead.finalizados.map((finalizado) => (
                  <Card key={finalizado.id} className="p-3">
                    <div className="text-sm">
                      <strong>Data Última Compra:</strong> {finalizado.data_ultima_compra ? new Date(finalizado.data_ultima_compra).toLocaleDateString('pt-BR') : 'Não informado'}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailModal;
