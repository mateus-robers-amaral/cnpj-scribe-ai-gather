
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface StatusChartProps {
  data: Array<{
    status: string;
    count: number;
  }>;
}

const StatusChart: React.FC<StatusChartProps> = ({ data }) => {
  const COLORS = {
    novo: '#3b82f6',
    em_validacao: '#f59e0b',
    finalizado: '#10b981'
  };

  const chartData = data.map(item => ({
    name: item.status === 'novo' ? 'Novo' : 
          item.status === 'em_validacao' ? 'Em Validação' : 'Finalizado',
    value: item.count,
    status: item.status
  }));

  const chartConfig = {
    novo: { label: 'Novo', color: COLORS.novo },
    em_validacao: { label: 'Em Validação', color: COLORS.em_validacao },
    finalizado: { label: 'Finalizado', color: COLORS.finalizado }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Leads por Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default StatusChart;
