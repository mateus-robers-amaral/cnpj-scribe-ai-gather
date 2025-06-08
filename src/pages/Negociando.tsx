
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowUpDown } from 'lucide-react';

interface Negociacao {
  id: string;
  lead_id: string | null;
  status: string | null;
  data_status: string | null;
  leads?: {
    nome_fantasia: string;
    cnpj: string;
  };
}

const Negociando = () => {
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
  const [filteredNegociacoes, setFilteredNegociacoes] = useState<Negociacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const { toast } = useToast();

  const fetchNegociacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('negociacoes')
        .select(`
          *,
          leads (
            nome_fantasia,
            cnpj
          )
        `)
        .order('data_status', { ascending: sortOrder === 'asc' });

      if (error) {
        throw error;
      }

      setNegociacoes(data || []);
    } catch (error) {
      console.error('Error fetching negociacoes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar negociações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNegociacoes();
  }, [sortOrder]);

  useEffect(() => {
    let filtered = negociacoes;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(neg => neg.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(neg => 
        neg.leads?.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        neg.leads?.cnpj.includes(searchTerm) ||
        (neg.lead_id && neg.lead_id.includes(searchTerm))
      );
    }

    setFilteredNegociacoes(filtered);
    setCurrentPage(1);
  }, [statusFilter, searchTerm, negociacoes]);

  const paginatedNegociacoes = filteredNegociacoes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredNegociacoes.length / itemsPerPage);

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
          <h1 className="text-4xl font-bold mb-4">Negociações</h1>
          <p className="text-xl text-muted-foreground">
            Acompanhe todas as negociações em andamento
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle>Lista de Negociações</CardTitle>
                <CardDescription>
                  {filteredNegociacoes.length} de {negociacoes.length} negociações
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
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="tabela_enviada">Tabela Enviada</SelectItem>
                    <SelectItem value="resposta_obtida">Resposta Obtida</SelectItem>
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
                        Data do Status
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedNegociacoes.map((negociacao) => (
                    <TableRow key={negociacao.id}>
                      <TableCell className="font-medium">
                        {negociacao.leads?.nome_fantasia || 'Empresa não encontrada'}
                      </TableCell>
                      <TableCell>
                        {negociacao.leads?.cnpj || '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {negociacao.lead_id || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          negociacao.status === 'tabela_enviada' 
                            ? 'bg-purple-100 text-purple-800' 
                            : negociacao.status === 'resposta_obtida'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {negociacao.status === 'tabela_enviada' ? 'Tabela Enviada' : 
                           negociacao.status === 'resposta_obtida' ? 'Resposta Obtida' : 
                           negociacao.status || 'Indefinido'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {negociacao.data_status 
                          ? new Date(negociacao.data_status).toLocaleDateString('pt-BR')
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

            {filteredNegociacoes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhuma negociação encontrada com os filtros aplicados.' 
                    : 'Nenhuma negociação encontrada.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Negociando;
