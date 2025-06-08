import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowUpDown } from 'lucide-react';
import LeadDetailModal from '@/components/LeadDetailModal';

interface Finalizado {
  id: string | null;
  lead_id: string | null;
  data_ultima_compra: string | null;
  cor_status: string | null;
  leads?: {
    nome_fantasia: string;
    cnpj: string;
  };
}

interface DetailedLead {
  id: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string | null;
  endereco: string | null;
  status: string | null;
  data_criacao: string | null;
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

const Finalizados = () => {
  const [finalizados, setFinalizados] = useState<Finalizado[]>([]);
  const [filteredFinalizados, setFilteredFinalizados] = useState<Finalizado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [selectedLead, setSelectedLead] = useState<DetailedLead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchFinalizados = async () => {
    try {
      // First get finalizados data
      const { data: finalizadosData, error: finalizadosError } = await supabase
        .from('finalizados_com_status')
        .select('*')
        .order('data_ultima_compra', { ascending: sortOrder === 'asc' });

      if (finalizadosError) throw finalizadosError;

      // Get unique lead IDs
      const leadIds = finalizadosData?.map(f => f.lead_id).filter(Boolean) || [];
      
      // Fetch lead details
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('id, nome_fantasia, cnpj')
        .in('id', leadIds);

      if (leadsError) throw leadsError;

      // Combine data
      const combinedData = finalizadosData?.map(finalizado => ({
        ...finalizado,
        leads: leadsData?.find(lead => lead.id === finalizado.lead_id)
      })) || [];

      setFinalizados(combinedData);
    } catch (error) {
      console.error('Error fetching finalizados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar finalizados. Tente novamente.",
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
    fetchFinalizados();
  }, [sortOrder]);

  useEffect(() => {
    let filtered = finalizados;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(fin => fin.cor_status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(fin => 
        fin.leads?.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fin.leads?.cnpj.includes(searchTerm) ||
        (fin.lead_id && fin.lead_id.includes(searchTerm))
      );
    }

    setFilteredFinalizados(filtered);
    setCurrentPage(1);
  }, [statusFilter, searchTerm, finalizados]);

  const paginatedFinalizados = filteredFinalizados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredFinalizados.length / itemsPerPage);

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'verde': return 'bg-green-100 text-green-800';
      case 'amarelo': return 'bg-yellow-100 text-yellow-800';
      case 'vermelho': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-4xl font-bold mb-4">Finalizados</h1>
          <p className="text-xl text-muted-foreground">
            Visualize todos os leads finalizados e seus status
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle>Lista de Finalizados</CardTitle>
                <CardDescription>
                  {filteredFinalizados.length} de {finalizados.length} finalizados
                </CardDescription>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Buscar por empresa ou CNPJ..."
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
                    <SelectItem value="verde">Verde</SelectItem>
                    <SelectItem value="amarelo">Amarelo</SelectItem>
                    <SelectItem value="vermelho">Vermelho</SelectItem>
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
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={handleSortToggle}
                        className="flex items-center gap-2 p-0 h-auto"
                      >
                        Data Última Compra
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFinalizados.map((finalizado, index) => (
                    <TableRow 
                      key={finalizado.id || `finalizado-${index}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => finalizado.lead_id && fetchLeadDetails(finalizado.lead_id)}
                    >
                      <TableCell className="font-medium">
                        {finalizado.leads?.nome_fantasia || 'Empresa não encontrada'}
                      </TableCell>
                      <TableCell>
                        {finalizado.leads?.cnpj || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {finalizado.lead_id || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(finalizado.cor_status)}`}>
                          {finalizado.cor_status?.charAt(0).toUpperCase() + finalizado.cor_status?.slice(1) || 'Indefinido'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {finalizado.data_ultima_compra 
                          ? new Date(finalizado.data_ultima_compra).toLocaleDateString('pt-BR')
                          : '-'
                        }
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

            {filteredFinalizados.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhum finalizado encontrado com os filtros aplicados.' 
                    : 'Nenhum finalizado encontrado.'
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

export default Finalizados;
