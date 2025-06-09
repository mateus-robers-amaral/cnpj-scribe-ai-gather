
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface MonthlyChartProps {
  data: Array<{
    month: string;
    count: number;
  }>;
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  const chartConfig = {
    count: { label: 'Leads', color: '#3b82f6' }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads por Mês (Últimos 6 Meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="horizontal">
              <XAxis type="number" />
              <YAxis dataKey="month" type="category" width={80} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyChart;
