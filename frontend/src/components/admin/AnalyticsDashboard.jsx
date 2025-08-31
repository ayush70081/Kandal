import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, ChartDataLabels);

const AnalyticsDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [geo, setGeo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [o, r, u, g] = await Promise.all([
          adminAPI.analyticsOverview(),
          adminAPI.analyticsReports(),
          adminAPI.analyticsUsers(),
          adminAPI.analyticsGeographic()
        ]);
        if (o.data.success) setOverview(o.data.data);
        if (r.data.success) {
          console.log('Weekly reports data:', r.data.data.weekly);
          setReports(r.data.data.weekly || []);
        }
        if (u.data.success) setUsers(u.data.data.contribution || []);
        if (g.data.success) setGeo(g.data.data.byTypeAndSeverity || []);
        setError(null);
      } catch (e) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
         plugins: {
       legend: {
         display: false, // Hide the legend completely
       },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#10b981',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
                 ticks: {
           color: '#4b5563',
           font: {
             size: 12,
             weight: '500',
             family: 'Inter, system-ui, sans-serif'
           },
           padding: 8
         },
                 title: {
           display: true,
           text: 'Days of the Week',
           color: '#1f2937',
           font: {
             size: 16,
             weight: '600',
             family: 'Inter, system-ui, sans-serif'
           },
           padding: {
             top: 15
           }
         }
      },
      y: {
                 grid: {
           color: '#e5e7eb',
           borderDash: [3, 3],
           lineWidth: 1
         },
                 ticks: {
           color: '#4b5563',
           font: {
             size: 12,
             weight: '500',
             family: 'Inter, system-ui, sans-serif'
           },
           beginAtZero: true,
           precision: 0,
           min: 0, // Force minimum to 0
           max: function(context) {
             const maxValue = Math.max(...context.chart.data.datasets[0].data);
             return Math.max(1, maxValue); // At least show 1, or the actual max
           },
           padding: 8
         },
                 title: {
           display: true,
           text: 'Reports Submitted',
           color: '#1f2937',
           font: {
             size: 16,
             weight: '600',
             family: 'Inter, system-ui, sans-serif'
           },
           padding: {
             bottom: 15
           }
         }
      }
    }
  };

  if (loading) return <div className="admin-loading">Loading analytics...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Analytics Dashboard</h1>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {overview && (
        <>
                     <div className="admin-cards">
             <div className="admin-card">
               <h3>Total Reports</h3>
               <div className="value">{overview.totalReports}</div>
             </div>
             <div className="admin-card">
               <h3>Active Users</h3>
               <div className="value">{overview.usersCount}</div>
             </div>
           </div>

          {reports.length > 0 && (
            <div className="admin-chart-container">
                             <div className="chart-header">
                 <h3 style={{
                   fontSize: '1.5rem',
                   fontWeight: '600',
                   color: '#1f2937',
                   margin: '0 0 1rem 0',
                   fontFamily: 'Inter, system-ui, sans-serif'
                 }}>Weekly Reports Trend</h3>
                 {reports.some(r => r.isSample) && (
                   <div style={{ 
                     backgroundColor: '#fef3c7', 
                     color: '#92400e', 
                     padding: '0.5rem', 
                     borderRadius: '0.375rem', 
                     fontSize: '0.875rem',
                     marginBottom: '1rem'
                   }}>
                     📊 Showing sample data (no reports in current week)
                   </div>
                 )}
               </div>
              <div style={{ height: '350px', position: 'relative' }}>
                <Line
                  data={{
                    labels: reports.map(r => r.day),
                                       datasets: [{
                     label: '', // Remove the label
                     data: reports.map(r => Math.max(0, r.count)), // Ensure no negative values
                     borderColor: '#10b981',
                     backgroundColor: 'rgba(16, 185, 129, 0.1)',
                     borderWidth: 3,
                     pointBackgroundColor: '#10b981',
                     pointBorderColor: '#ffffff',
                     pointBorderWidth: 2,
                     pointRadius: 6,
                     pointHoverRadius: 8,
                     tension: 0.4,
                     fill: true
                   }]
                  }}
                  options={{
                    ...chartOptions,
                    interaction: {
                      intersect: false,
                      mode: 'index'
                    },
                    plugins: {
                      ...chartOptions.plugins,
                                             tooltip: {
                         ...chartOptions.plugins.tooltip,
                         callbacks: {
                           title: function(context) {
                             const dayData = reports[context[0].dataIndex];
                             return dayData.day;
                           },
                           label: function(context) {
                             const displayCount = Math.max(0, context.parsed.y);
                             return `${displayCount} report${displayCount !== 1 ? 's' : ''}`;
                           }
                         }
                       }
                    }
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            {users.length > 0 && (
              <div className="admin-chart-container">
                <div className="chart-header">
                  <h3>User Contribution Levels</h3>
                  <div className="chart-stats">
                    <span className="stat-item">
                      <span className="stat-label">Total Users:</span>
                      <span className="stat-value">{users.reduce((sum, u) => sum + u.count, 0)}</span>
                    </span>
                  </div>
                </div>
                <div style={{ height: '320px' }}>
                  <Bar 
                    data={{
                      labels: users.map(u => u._id.charAt(0).toUpperCase() + u._id.slice(1)),
                      datasets: [{
                        label: 'Number of Users',
                        data: users.map(u => u.count),
                        backgroundColor: [
                          '#cd7f32', // Bronze
                          '#c0c0c0', // Silver
                          '#ffd700', // Gold
                          '#e5e4e2'  // Platinum
                        ],
                        borderRadius: 6,
                        borderSkipped: false,
                        borderWidth: 0
                      }]
                    }}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: function(context) {
                              return `${context.label}: ${context.parsed.y} users`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {overview.statusStats?.length > 0 && (
              <div className="admin-chart-container">
                               <div className="chart-header">
                 <h3>Report Status Distribution</h3>
               </div>
                <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '280px', height: '280px' }}>
                    <Doughnut 
                      data={{
                        labels: overview.statusStats.map(s => s._id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())),
                        datasets: [{
                          data: overview.statusStats.map(s => s.count),
                          backgroundColor: [
                            '#fbbf24', // pending
                            '#10b981', // verified
                            '#ef4444', // rejected
                            '#6366f1', // under_review
                          ],
                          borderWidth: 3,
                          borderColor: '#ffffff',
                          hoverBorderWidth: 4,
                          hoverOffset: 8
                        }]
                      }}
                                                                options={{
                        ...chartOptions,
                        cutout: '60%',
                        scales: {
                          x: {
                            display: false
                          },
                          y: {
                            display: false
                          }
                        },
                        plugins: {
                          ...chartOptions.plugins,
                          tooltip: {
                            ...chartOptions.plugins.tooltip,
                            callbacks: {
                              label: function(context) {
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                              }
                            }
                          },
                          datalabels: {
                            color: '#ffffff',
                            font: {
                              weight: 'bold',
                              size: 14
                            },
                            formatter: function(value, context) {
                              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${percentage}%\n${context.chart.data.labels[context.dataIndex]}`;
                            },
                            textAlign: 'center',
                            textBaseline: 'middle'
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {geo.length > 0 && (
            <div className="admin-chart-container">
              <h3>Reports by Type and Severity</h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Incident Type</th>
                      <th>Severity</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geo.slice(0, 10).map((item, idx) => {
                      const total = geo.reduce((sum, g) => sum + g.count, 0);
                      const percentage = ((item.count / total) * 100).toFixed(1);
                      return (
                        <tr key={idx}>
                          <td>{item._id.type?.replace('_', ' ') || 'Unknown'}</td>
                          <td>
                            <span className={`status-badge severity-${item._id.severity}`}>
                              {item._id.severity}
                            </span>
                          </td>
                          <td><strong>{item.count}</strong></td>
                          <td>{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!overview && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <h3>No analytics data available</h3>
          <p>Analytics will appear once there is data to analyze.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
