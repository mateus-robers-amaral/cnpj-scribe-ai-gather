
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, FileText, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import EditLeadModal from './EditLeadModal';

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
  onLeadUpdated?: () => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  lead, 
  onLeadUpdated 
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast } = useToast();

  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case 'novo': return 'bg-blue-100 text-blue-800';
      case 'em_validacao': return 'bg-yellow-100 text-yellow-800';
      case 'finalizado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteLead = async () => {
    if (!lead) return;

    try {
      // 1. Excluir registros relacionados em negociacoes
      const { error: negociacoesError } = await supabase
        .from('negociacoes')
        .delete()
        .eq('lead_id', lead.id);

      if (negociacoesError) throw negociacoesError;

      // 2. Excluir registros relacionados em validacoes
      const { error: validacoesError } = await supabase
        .from('validacoes')
        .delete()
        .eq('lead_id', lead.id);

      if (validacoesError) throw validacoesError;

      // 3. Excluir registros relacionados em finalizados
      const { error: finalizadosError } = await supabase
        .from('finalizados')
        .delete()
        .eq('lead_id', lead.id);

      if (finalizadosError) throw finalizadosError;

      // 4. Excluir o lead principal
      const { error: leadError } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id);

      if (leadError) throw leadError;

      toast({
        title: 'Sucesso',
        description: 'Lead e todos os registros relacionados foram excluídos com sucesso!',
      });

      if (onLeadUpdated) onLeadUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir lead e registros relacionados.',
        variant: 'destructive',
      });
    }
  };

  if (!lead) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Detalhes do Lead</DialogTitle>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Deletar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este lead? Esta ação irá remover o lead e todos os registros relacionados (validações, negociações e finalizações). Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteLead}>
                        Confirmar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
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

      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={lead}
        onLeadUpdated={() => {
          if (onLeadUpdated) onLeadUpdated();
          setIsEditModalOpen(false);
        }}
      />
    </>
  );
};

export default LeadDetailModal;
