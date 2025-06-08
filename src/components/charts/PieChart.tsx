import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export interface PieChartData {
  labels: string[];
  datasets: {
    label?: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

export interface PieChartProps {
  data: PieChartData;
  title?: string;
  height?: number;
  showLegend?: boolean;
  animated?: boolean;
  doughnut?: boolean;
  cutout?: string;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  height = 300,
  showLegend = true,
  animated = true,
  doughnut = false,
  cutout = '50%',
  className = '',
}) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: doughnut ? cutout : 0,
    animation: {
      duration: animated ? 750 : 0,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor ? dataset.borderColor[i] : '#fff',
                  lineWidth: dataset.borderWidth || 2,
                  hidden: isNaN(dataset.data[i]),
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        titleFont: {
          size: 14,
          weight: '600' as const,
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderColor: '#fff',
      },
    },
  };

  // Apply default styling to datasets if not provided
  const styledData = {
    ...data,
    datasets: data.datasets.map((dataset, datasetIndex) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || generateDefaultColors(data.labels.length),
      borderColor: dataset.borderColor || '#fff',
      borderWidth: dataset.borderWidth || 2,
    })),
  };

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          {title}
        </h3>
      )}
      <Pie 
        data={styledData} 
        options={options}
        aria-label={title ? `Pie chart: ${title}` : 'Pie chart'}
        role="img"
      />
    </div>
  );
};

// Helper function to generate default colors for pie chart segments
function generateDefaultColors(count: number): string[] {
  const baseColors = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316', // orange-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
  ];

  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
}

export default PieChart; 