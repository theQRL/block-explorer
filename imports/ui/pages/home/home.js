import { homechart } from '/imports/api/index.js'

import './home.html'
import '../../components/status/status.js'

let chartIntervalHandle

function renderChart() {
  // Get Chart data from Mongo
  const chartLineData = homechart.findOne()

  // Only render chart if we get valid data back
  if (chartLineData !== undefined) {
    // Hide loading svg
    $('#chartLoading').hide()

    // Draw chart
    const ctx = document.getElementById('myChart').getContext('2d')
    // eslint-disable-next-line
    const myChart = new Chart(ctx, {
      type: 'line',
      data: chartLineData,
      options: {
        legend: {
          labels: {
            fontColor: '#ffffff',
          },
        },
        tooltips: {
          mode: 'index',
        },
        responsive: true,
        maintainAspectRatio: false,
        hoverMode: 'index',
        stacked: false,
        scales: {
          xAxes: [{
            ticks: {
              fontColor: '#ffffff',
            },
            scaleLabel: {
              display: true,
              labelString: 'Block Number',
              fontColor: '#ffffff',
            },
          }],
          yAxes: [{
            fontColor: '#ffffff',
            type: 'linear',
            display: true,
            position: 'left',
            id: 'y-axis-1',
            ticks: {
              beginAtZero: true,
              max: 150,
              fontColor: '#20E7C9',
            },
            scaleLabel: {
              display: true,
              labelString: 'Seconds',
              fontColor: '#ffffff',
            },
          }, {
            type: 'linear',
            fontColor: '#ffffff',
            display: true,
            position: 'right',
            id: 'y-axis-2',
            gridLines: {
              drawOnChartArea: false,
            },
            ticks: {
              fontColor: '#DC255D',
            },
            scaleLabel: {
              display: true,
              labelString: 'Hashes Per Second',
              fontColor: '#ffffff',
            },
          }],
        },
      },
    })

    // Clear Interval
    Meteor.clearInterval(chartIntervalHandle)
  }
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
