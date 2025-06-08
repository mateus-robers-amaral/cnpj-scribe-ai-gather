
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowUpDown, ArrowRight } from 'lucide-react';
import LeadDetailModal from '@/components/LeadDetailModal';

interface Lead {
  id: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string | null;
  endereco: string | null;
  status: string | null;
  data_criacao: string | null;
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

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [selectedLead, setSelectedLead] = useState<DetailedLead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('data_criacao', { ascending: sortOrder === 'asc' });

      if (error) {
        throw error;
      }

      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar leads. Tente novamente.",
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

  const moveToNegociacao = async (leadId: string) => {
    try {
      // Start a transaction by inserting into negociacoes first
      const { error: insertError } = await supabase
        .from('negociacoes')
        .insert({
          lead_id: leadId,
          status: 'tabela_enviada',
          data_status: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // If insert was successful, remove from leads table
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (deleteError) throw deleteError;

      toast({
        title: "Sucesso",
        description: "Lead movido para negociação com sucesso!",
      });

      // Refresh the leads list
      fetchLeads();
    } catch (error) {
      console.error('Error moving lead to negotiation:', error);
      toast({
        title: "Erro",
        description: "Erro ao mover lead para negociação.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [sortOrder]);

  useEffect(() => {
    let filtered = leads;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.cnpj.includes(searchTerm) ||
        (lead.telefone && lead.telefone.includes(searchTerm))
      );
    }

    setFilteredLeads(filtered);
    setCurrentPage(1);
  }, [statusFilter, searchTerm, leads]);

  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
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
          <h1 className="text-4xl font-bold mb-4">Leads</h1>
          <p className="text-xl text-muted-foreground">
            Gerencie todos os leads do sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle>Lista de Leads</CardTitle>
                <CardDescription>
                  {filteredLeads.length} de {leads.length} leads
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Buscar por nome, CNPJ ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-80"
                />
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="em_validacao">Em Validação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Fantasia</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={handleSortToggle}
                        className="flex items-center gap-2 p-0 h-auto"
                      >
                        Data de Criação
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLeads.map((lead) => (
                    <TableRow 
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => fetchLeadDetails(lead.id)}
                    >
                      <TableCell className="font-medium">
                        {lead.nome_fantasia}
                      </TableCell>
                      <TableCell>{lead.cnpj}</TableCell>
                      <TableCell>{lead.telefone || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {lead.endereco || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lead.status === 'novo' 
                            ? 'bg-blue-100 text-blue-800' 
                            : lead.status === 'em_validacao'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.status || 'Novo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {lead.data_criacao 
                          ? new Date(lead.data_criacao).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ArrowRight className="h-4 w-4 mr-1" />
                              Negociar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mover para Negociação</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja mover este lead para a fase de negociação?
                                O lead será removido da lista de leads e adicionado às negociações.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => moveToNegociacao(lead.id)}>
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}

            {filteredLeads.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhum lead encontrado com os filtros aplicados.' 
                    : 'Nenhum lead encontrado.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <LeadDetailModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          lead={selectedLead}
        />
      </div>
    </div>
  );
};

export default Leads;
