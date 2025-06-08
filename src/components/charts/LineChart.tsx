import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
    tension?: number;
  }[];
}

export interface LineChartProps {
  data: LineChartData;
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  animated?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  animated = true,
  className = '',
}) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: animated ? 750 : 0,
      easing: 'easeInOutQuart' as const,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: '600' as const,
          family: 'Inter, system-ui, sans-serif',
        },
        padding: {
          bottom: 20,
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
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: showGrid,
          color: '#f3f4f6',
          lineWidth: 1,
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
          color: '#6b7280',
        },
      },
      y: {
        display: true,
        grid: {
          display: showGrid,
          color: '#f3f4f6',
          lineWidth: 1,
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
          color: '#6b7280',
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
      line: {
        borderWidth: 2,
        tension: 0.4,
      },
    },
  };

  // Apply default styling to datasets if not provided
  const styledData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || getDefaultColor(index),
      backgroundColor: dataset.backgroundColor || getDefaultColor(index, 0.1),
      fill: dataset.fill !== undefined ? dataset.fill : false,
      tension: dataset.tension !== undefined ? dataset.tension : 0.4,
    })),
  };

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <Line 
        data={styledData} 
        options={options}
        aria-label={title ? `Line chart: ${title}` : 'Line chart'}
        role="img"
      />
    </div>
  );
};

// Helper function to get default colors for datasets
function getDefaultColor(index: number, alpha = 1): string {
  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316', // orange-500
  ];
  
  const color = colors[index % colors.length];
  
  if (alpha === 1) {
    return color;
  }
  
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default LineChart; 