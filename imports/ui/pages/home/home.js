import { homechart } from '/imports/api/index.js'

import './home.html'
import '../../components/status/status.js'
/* global LocalStore */

let chartIntervalHandle

export function renderChart() {
  // Get Chart data from Mongo
  const chartLineData = homechart.findOne()

  // Only render chart if we get valid data back
  if (chartLineData !== undefined) {
    // Hide loading animation
    $('#chartLoading').hide()

    // Determine theme colors
    const isDark = LocalStore.get('theme') !== 'light'
    const colors = {
      text: isDark ? '#EAEFF5' : '#0B181E',
      grid: isDark ? 'rgba(234, 239, 245, 0.1)' : 'rgba(11, 24, 30, 0.1)',
      background: isDark ? 'rgba(74, 175, 255, 0.05)' : 'rgba(74, 175, 255, 0.02)'
    }

    // Create gradient backgrounds for datasets
    const ctx = document.getElementById('myChart').getContext('2d')
    
    // Hash Power Gradient (Orange)
    const hashPowerGradient = ctx.createLinearGradient(0, 0, 0, 300)
    hashPowerGradient.addColorStop(0, 'rgba(255, 167, 41, 0.3)')
    hashPowerGradient.addColorStop(1, 'rgba(255, 167, 41, 0.01)')
    
    // Block Time Gradient (Blue)
    const blockTimeGradient = ctx.createLinearGradient(0, 0, 0, 300)
    blockTimeGradient.addColorStop(0, 'rgba(74, 175, 255, 0.3)')
    blockTimeGradient.addColorStop(1, 'rgba(74, 175, 255, 0.01)')
    
    // Difficulty Gradient (Purple)
    const difficultyGradient = ctx.createLinearGradient(0, 0, 0, 300)
    difficultyGradient.addColorStop(0, 'rgba(156, 163, 175, 0.3)')
    difficultyGradient.addColorStop(1, 'rgba(156, 163, 175, 0.01)')

    // Update dataset styles with modern gradients and styling
    const modernData = { ...chartLineData }
    
    // Find and update each dataset
    modernData.datasets = modernData.datasets.map(dataset => {
      const baseDataset = {
        ...dataset,
        tension: 0.4, // Smooth curves
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBorderWidth: 3,
        borderWidth: 3,
        pointBorderWidth: 0,
        pointHoverBorderColor: '#ffffff',
      }

      switch(dataset.label) {
        case 'Hash Power (hps)':
          return {
            ...baseDataset,
            borderColor: '#FFA729',
            backgroundColor: hashPowerGradient,
            fill: true,
            pointHoverBackgroundColor: '#FFA729',
          }
        case 'Block Time Average (s)':
          return {
            ...baseDataset,
            borderColor: '#4AAFFF',
            backgroundColor: blockTimeGradient,
            fill: true,
            pointHoverBackgroundColor: '#4AAFFF',
          }
        case 'Difficulty':
          return {
            ...baseDataset,
            borderColor: '#9CA3AF',
            backgroundColor: difficultyGradient,
            fill: true,
            pointHoverBackgroundColor: '#9CA3AF',
          }
        case 'Block Time (s)':
          return {
            ...baseDataset,
            borderColor: 'rgba(109, 116, 120, 0.6)',
            backgroundColor: 'transparent',
            fill: false,
            pointRadius: 1,
            pointHoverRadius: 4,
            borderWidth: 1,
            pointHoverBackgroundColor: '#6D7478',
          }
        default:
          return baseDataset
      }
    })

    // Modern Chart.js v4 configuration
    const myChart = new Chart(ctx, {
      type: 'line',
      data: modernData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false, // We have custom legend in HTML
          },
          tooltip: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: colors.text,
            bodyColor: colors.text,
            borderColor: isDark ? 'rgba(74, 175, 255, 0.3)' : 'rgba(74, 175, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 12,
            padding: 12,
            displayColors: true,
            usePointStyle: true,
            callbacks: {
              title: function(context) {
                return `Block ${context[0].label}`
              },
              label: function(context) {
                const label = context.dataset.label || ''
                const value = context.parsed.y
                
                if (label.includes('Hash Power')) {
                  return `${label}: ${Number(value).toLocaleString()} hps`
                } else if (label.includes('Difficulty')) {
                  return `${label}: ${Number(value).toLocaleString()}`
                } else {
                  return `${label}: ${Number(value).toFixed(2)}s`
                }
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            display: true,
            title: {
              display: true,
              text: 'Block Number',
              color: colors.text,
              font: {
                size: 12,
                weight: '600'
              }
            },
            ticks: {
              color: colors.text,
              font: {
                size: 11
              }
            },
            grid: {
              color: colors.grid,
              drawBorder: false,
            }
          },
          'y-axis-1': {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Block Time (seconds)',
              color: colors.text,
              font: {
                size: 12,
                weight: '600'
              }
            },
            ticks: {
              beginAtZero: true,
              max: 150,
              color: '#4AAFFF',
              font: {
                size: 11
              }
            },
            grid: {
              color: colors.grid,
              drawBorder: false,
            }
          },
          'y-axis-2': {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Hash Power & Difficulty',
              color: colors.text,
              font: {
                size: 12,
                weight: '600'
              }
            },
            ticks: {
              color: '#FFA729',
              font: {
                size: 11
              }
            },
            grid: {
              drawOnChartArea: false,
              color: colors.grid,
              drawBorder: false,
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart'
        },
        elements: {
          point: {
            hoverRadius: 8,
          }
        }
      }
    })

    // Clear Interval
    Meteor.clearInterval(chartIntervalHandle)
  }
  return true
}

Template.appHome.onCreated(() => {
  Session.set('homechart', {})
  Meteor.subscribe('homechart')
})

Template.appHome.onRendered(() => {
  const h = $('#statusSegment').height()
  const canvas = $('canvas')
  const newWidth = canvas.parent().width()
  const newHeight = canvas.parent().height() // eslint-disable-line
  canvas.prop({
    width: newWidth,
    height: h,
  })
  $('#chart').parent().height(h)

  // Display chart - wait for data if it doesn't yet exist in mongo
  chartIntervalHandle = Meteor.setInterval(() => {
    renderChart()
  }, 500)
})
