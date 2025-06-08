
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, Phone, MapPin, FileText } from 'lucide-react';

interface Lead {
  id: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string | null;
  endereco: string | null;
  status: string | null;
  data_criacao: string | null;
}

interface Negociacao {
  id: string;
  status: string | null;
  data_status: string | null;
  lead_id: string | null;
  leads?: {
    nome_fantasia: string;
    cnpj: string;
    telefone: string | null;
    endereco: string | null;
  };
}

interface Finalizado {
  id: string | null;
  data_ultima_compra: string | null;
  cor_status: string | null;
  lead_id: string | null;
  leads?: {
    nome_fantasia: string;
    cnpj: string;
    telefone: string | null;
    endereco: string | null;
  };
}

interface DetailedLead extends Lead {
  validacoes: Array<{
    id: string;
    resultado: string | null;
    credibilidade: number | null;
    cnaes_compatíveis: boolean | null;
    data_validacao: string | null;
  }>;
  negociacoes: Array<{
    id: string;
    status: string | null;
    data_status: string | null;
  }>;
  finalizados: Array<{
    id: string;
    data_ultima_compra: string | null;
  }>;
}

const SalesDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
  const [finalizados, setFinalizados] = useState<Finalizado[]>([]);
  const [selectedLead, setSelectedLead] = useState<DetailedLead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      // Fetch leads with status "novo" or "em_validacao"
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .in('status', ['novo', 'em_validacao'])
        .order('data_criacao', { ascending: false });

      if (leadsError) throw leadsError;

      // Fetch negociacoes with status "tabela_enviada" or "resposta_obtida"
      const { data: negociacoesData, error: negociacoesError } = await supabase
        .from('negociacoes')
        .select(`
          *,
          leads (
            nome_fantasia,
            cnpj,
            telefone,
            endereco
          )
        `)
        .in('status', ['tabela_enviada', 'resposta_obtida'])
        .order('data_status', { ascending: false });

      if (negociacoesError) throw negociacoesError;

      // Fetch finalizados from the view
      const { data: finalizadosData, error: finalizadosError } = await supabase
        .from('finalizados_com_status')
        .select('*')
        .order('data_ultima_compra', { ascending: false });

      if (finalizadosError) throw finalizadosError;

      // Get lead details for finalizados
      const leadIds = finalizadosData?.map(f => f.lead_id).filter(Boolean) || [];
      const { data: finalizadosLeads, error: finalizadosLeadsError } = await supabase
        .from('leads')
        .select('id, nome_fantasia, cnpj, telefone, endereco')
        .in('id', leadIds);

      if (finalizadosLeadsError) throw finalizadosLeadsError;

      // Combine finalizados with lead data
      const finalizadosWithLeads = finalizadosData?.map(finalizado => ({
        ...finalizado,
        leads: finalizadosLeads?.find(lead => lead.id === finalizado.lead_id)
      })) || [];

      setLeads(leadsData || []);
      setNegociacoes(negociacoesData || []);
      setFinalizados(finalizadosWithLeads);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeadDetails = async (leadId: string) => {
    try {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      const { data: validacoes, error: validacoesError } = await supabase
        .from('validacoes')
        .select('*')
        .eq('lead_id', leadId);

      const { data: negociacoes, error: negociacoesError } = await supabase
        .from('negociacoes')
        .select('*')
        .eq('lead_id', leadId);

      const { data: finalizados, error: finalizadosError } = await supabase
        .from('finalizados')
        .select('*')
        .eq('lead_id', leadId);

      if (validacoesError) throw validacoesError;
      if (negociacoesError) throw negociacoesError;
      if (finalizadosError) throw finalizadosError;

      const leadDetails: DetailedLead = {
        ...leadData,
        validacoes: validacoes || [],
        negociacoes: negociacoes || [],
        finalizados: finalizados || [],
      };

      setSelectedLead(leadDetails);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching lead details:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes do lead.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadgeColor = (status: string | null, type: 'lead' | 'negociacao' | 'finalizado') => {
    if (type === 'lead') {
      switch (status) {
        case 'novo': return 'bg-blue-100 text-blue-800';
        case 'em_validacao': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else if (type === 'negociacao') {
      switch (status) {
        case 'tabela_enviada': return 'bg-purple-100 text-purple-800';
        case 'resposta_obtida': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else {
      switch (status) {
        case 'verde': return 'bg-green-100 text-green-800';
        case 'amarelo': return 'bg-yellow-100 text-yellow-800';
        case 'vermelho': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  };

  const getFinalizadosByStatus = (corStatus: string) => {
    return finalizados.filter(f => f.cor_status === corStatus);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Dashboard de Vendas</h1>
          <p className="text-xl text-muted-foreground">
            Visão unificada do pipeline de vendas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leads Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Leads</h2>
              <Badge variant="outline" className="text-sm">
                {leads.length}
              </Badge>
            </div>
            
            <div className="space-y-3 min-h-[400px]">
              {leads.map((lead) => (
                <Card 
                  key={lead.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => fetchLeadDetails(lead.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {lead.nome_fantasia}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Badge className={`text-xs ${getStatusBadgeColor(lead.status, 'lead')}`}>
                        {lead.status === 'novo' ? 'Novo' : 'Em Validação'}
                      </Badge>
                      
                      {lead.telefone && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          {lead.telefone}
                        </div>
                      )}
                      
                      {lead.data_criacao && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(lead.data_criacao).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {leads.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Nenhum lead encontrado
                </div>
              )}
            </div>
          </div>

          {/* Negociações Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Negociando</h2>
              <Badge variant="outline" className="text-sm">
                {negociacoes.length}
              </Badge>
            </div>
            
            <div className="space-y-3 min-h-[400px]">
              {negociacoes.map((negociacao) => (
                <Card 
                  key={negociacao.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => negociacao.lead_id && fetchLeadDetails(negociacao.lead_id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {negociacao.leads?.nome_fantasia || 'Nome não disponível'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <Badge className={`text-xs ${getStatusBadgeColor(negociacao.status, 'negociacao')}`}>
                        {negociacao.status === 'tabela_enviada' ? 'Tabela Enviada' : 'Resposta Obtida'}
                      </Badge>
                      
                      {negociacao.leads?.telefone && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          {negociacao.leads.telefone}
                        </div>
                      )}
                      
                      {negociacao.data_status && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(negociacao.data_status).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {negociacoes.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Nenhuma negociação encontrada
                </div>
              )}
            </div>
          </div>

          {/* Finalizados Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Finalizados</h2>
              <Badge variant="outline" className="text-sm">
                {finalizados.length}
              </Badge>
            </div>
            
            <div className="space-y-3 min-h-[400px]">
              {['verde', 'amarelo', 'vermelho'].map((cor) => {
                const statusFinalizados = getFinalizadosByStatus(cor);
                
                return statusFinalizados.map((finalizado) => (
                  <Card 
                    key={finalizado.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => finalizado.lead_id && fetchLeadDetails(finalizado.lead_id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {finalizado.leads?.nome_fantasia || 'Nome não disponível'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <Badge className={`text-xs ${getStatusBadgeColor(finalizado.cor_status, 'finalizado')}`}>
                          {finalizado.cor_status?.charAt(0).toUpperCase() + finalizado.cor_status?.slice(1)}
                        </Badge>
                        
                        {finalizado.leads?.telefone && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 mr-1" />
                            {finalizado.leads.telefone}
                          </div>
                        )}
                        
                        {finalizado.data_ultima_compra && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(finalizado.data_ultima_compra).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ));
              })}
              
              {finalizados.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  Nenhum finalizado encontrado
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lead Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Lead</DialogTitle>
            </DialogHeader>
            
            {selectedLead && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Informações Básicas</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Nome Fantasia:</strong> {selectedLead.nome_fantasia}</div>
                      <div><strong>CNPJ:</strong> {selectedLead.cnpj}</div>
                      <div><strong>Telefone:</strong> {selectedLead.telefone || 'Não informado'}</div>
                      <div><strong>Status:</strong> 
                        <Badge className={`ml-2 ${getStatusBadgeColor(selectedLead.status, 'lead')}`}>
                          {selectedLead.status || 'Não informado'}
                        </Badge>
                      </div>
                      <div><strong>Data de Criação:</strong> {selectedLead.data_criacao ? new Date(selectedLead.data_criacao).toLocaleDateString('pt-BR') : 'Não informado'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Endereço</h3>
                    <div className="flex items-start text-sm">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{selectedLead.endereco || 'Não informado'}</span>
                    </div>
                  </div>
                </div>

                {/* Validações */}
                {selectedLead.validacoes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Validações
                    </h3>
                    <div className="space-y-3">
                      {selectedLead.validacoes.map((validacao) => (
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
                {selectedLead.negociacoes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Negociações</h3>
                    <div className="space-y-3">
                      {selectedLead.negociacoes.map((negociacao) => (
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
                {selectedLead.finalizados.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Finalizações</h3>
                    <div className="space-y-3">
                      {selectedLead.finalizados.map((finalizado) => (
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SalesDashboard;
