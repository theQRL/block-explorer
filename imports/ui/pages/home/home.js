import { homechart } from '/imports/api/index.js'

import './home.html'
import '../../components/status/status.js'
/* global LocalStore */

let chartIntervalHandle

function renderChart() {
  // Get Chart data from Mongo
  const chartLineData = homechart.findOne()

  // Only render chart if we get valid data back
  if (chartLineData !== undefined) {
    // Hide loading svg
    $('#chartLoading').hide()

    // determine colour to use for labels
    let graphLabels = '#FFFFFF'
    const x = LocalStore.get('theme')
    if (x === 'light') {
      graphLabels = '#000000'
    }

    // Draw chart
    const ctx = document.getElementById('myChart').getContext('2d')
    // eslint-disable-next-line
    const myChart = new Chart(ctx, {
      type: 'line',
      data: chartLineData,
      options: {
        legend: {
          labels: {
            fontColor: graphLabels,
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
              fontColor: graphLabels,
            },
            scaleLabel: {
              display: true,
              labelString: 'Block Number',
              fontColor: graphLabels,
            },
          }],
          yAxes: [{
            fontColor: graphLabels,
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
              fontColor: graphLabels,
            },
          }, {
            type: 'linear',
            fontColor: graphLabels,
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
              fontColor: graphLabels,
            },
          }],
        },
      },
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
