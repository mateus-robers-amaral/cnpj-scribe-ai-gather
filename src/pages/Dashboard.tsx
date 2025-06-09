
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MetricsCards from '@/components/Dashboard/MetricsCards';
import DateRangeFilter from '@/components/Dashboard/DateRangeFilter';
import StatusChart from '@/components/Dashboard/StatusChart';
import MonthlyChart from '@/components/Dashboard/MonthlyChart';
import NegotiationChart from '@/components/Dashboard/NegotiationChart';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [negotiationStatusFilter, setNegotiationStatusFilter] = useState('all');
  
  // Metrics data
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalNegociacoes, setTotalNegociacoes] = useState(0);
  const [totalFinalizados, setTotalFinalizados] = useState(0);
  const [conversao, setConversao] = useState(0);
  const [tempoMedio, setTempoMedio] = useState(0);
  
  // Chart data
  const [statusData, setStatusData] = useState<Array<{ status: string; count: number }>>([]);
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; count: number }>>([]);
  const [negotiationData, setNegotiationData] = useState<Array<{ date: string; count: number }>>([]);
  
  const { toast } = useToast();

  const fetchMetrics = async () => {
    try {
      const dateFilter = startDate && endDate ? {
        gte: startDate.toISOString(),
        lte: endDate.toISOString()
      } : {};

      // Total leads
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('data_criacao', dateFilter.gte || '1900-01-01')
        .lte('data_criacao', dateFilter.lte || '2100-01-01');

      // Total negociações
      const { count: negociacoesCount } = await supabase
        .from('negociacoes')
        .select('*', { count: 'exact', head: true });

      // Total finalizados
      const { count: finalizadosCount } = await supabase
        .from('finalizados')
        .select('*', { count: 'exact', head: true });

      // Conversão e tempo médio
      const { data: finalizadosData } = await supabase
        .from('finalizados')
        .select(`
          data_ultima_compra,
          leads!inner(data_criacao)
        `);

      let tempoMedioCalculado = 0;
      if (finalizadosData && finalizadosData.length > 0) {
        const tempos = finalizadosData
          .filter(f => f.data_ultima_compra && f.leads?.data_criacao)
          .map(f => {
            const dataCompra = new Date(f.data_ultima_compra!);
            const dataCriacao = new Date(f.leads!.data_criacao!);
            return Math.floor((dataCompra.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24));
          });
        
        tempoMedioCalculado = tempos.length > 0 ? 
          Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0;
      }

      setTotalLeads(leadsCount || 0);
      setTotalNegociacoes(negociacoesCount || 0);
      setTotalFinalizados(finalizadosCount || 0);
      setConversao(leadsCount && leadsCount > 0 ? ((finalizadosCount || 0) / leadsCount) * 100 : 0);
      setTempoMedio(tempoMedioCalculado);

    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar métricas do dashboard.',
        variant: 'destructive',
      });
    }
  };

  const fetchStatusData = async () => {
    try {
      const { data } = await supabase
        .from('leads')
        .select('status')
        .gte('data_criacao', startDate?.toISOString() || '1900-01-01')
        .lte('data_criacao', endDate?.toISOString() || '2100-01-01');

      const statusCounts = data?.reduce((acc, lead) => {
        const status = lead.status || 'novo';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const chartData = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));

      setStatusData(chartData);
    } catch (error) {
      console.error('Erro ao buscar dados de status:', error);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const { data } = await supabase
        .from('leads')
        .select('data_criacao')
        .gte('data_criacao', subMonths(new Date(), 6).toISOString())
        .order('data_criacao');

      const monthlyGroups = data?.reduce((acc, lead) => {
        if (lead.data_criacao) {
          const month = format(new Date(lead.data_criacao), 'MMM yyyy', { locale: ptBR });
          acc[month] = (acc[month] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const chartData = Object.entries(monthlyGroups).map(([month, count]) => ({
        month,
        count
      }));

      setMonthlyData(chartData);
    } catch (error) {
      console.error('Erro ao buscar dados mensais:', error);
    }
  };

  const fetchNegotiationData = async () => {
    try {
      let query = supabase
        .from('negociacoes')
        .select('data_status, status')
        .gte('data_status', startDate?.toISOString() || '1900-01-01')
        .lte('data_status', endDate?.toISOString() || '2100-01-01');

      if (negotiationStatusFilter !== 'all') {
        query = query.eq('status', negotiationStatusFilter);
      }

      const { data } = await query.order('data_status');

      const dailyGroups = data?.reduce((acc, neg) => {
        if (neg.data_status) {
          const date = format(new Date(neg.data_status), 'dd/MM', { locale: ptBR });
          acc[date] = (acc[date] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const chartData = Object.entries(dailyGroups).map(([date, count]) => ({
        date,
        count
      }));

      setNegotiationData(chartData);
    } catch (error) {
      console.error('Erro ao buscar dados de negociação:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchMetrics(),
      fetchStatusData(),
      fetchMonthlyData(),
      fetchNegotiationData()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, negotiationStatusFilter]);

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
            Análise completa do pipeline de vendas
          </p>
        </div>

        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros Temporais</CardTitle>
          </CardHeader>
          <CardContent>
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
          </CardContent>
        </Card>

        {/* Metrics Cards */}
        <MetricsCards
          totalLeads={totalLeads}
          totalNegociacoes={totalNegociacoes}
          totalFinalizados={totalFinalizados}
          conversao={conversao}
          tempoMedio={tempoMedio}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <StatusChart data={statusData} />
          <MonthlyChart data={monthlyData} />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <NegotiationChart
            data={negotiationData}
            statusFilter={negotiationStatusFilter}
            onStatusFilterChange={setNegotiationStatusFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
