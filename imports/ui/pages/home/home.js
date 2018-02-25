import { homechart } from '/imports/api/index.js'

import './home.html'
import '../../components/status/status.js'

let chartIntervalHandle

function renderChart() {
  // Get Chart data from Mongo
  const chartLineData = homechart.findOne()

  // Only render chart if we get valid data back
  if(chartLineData !== undefined) {
    // Hide loading svg
    $('#chartLoading').hide();

    // Draw chart
    const ctx = document.getElementById('myChart').getContext('2d')
    let myChart = new Chart(ctx, {
      type: 'line',
      data: chartLineData,
      options: {
        tooltips: {
          mode: 'index'
        },
        responsive: true,
        maintainAspectRatio: false,
        hoverMode: 'index',
        stacked: false,
        scales: {
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: "Block Number"
              }
            }
          ],
          yAxes: [
            {
              type: "linear",
              display: true,
              position: "left",
              id: "y-axis-1",
              ticks: {
                beginAtZero: true,
                max: 150
              },
              scaleLabel: {
                display: true,
                labelString: "Seconds"
              }
            },{
              type: "linear",
              display: true,
              position: "right",
              id: "y-axis-2",
              gridLines: {
                drawOnChartArea: false,
              },
              scaleLabel: {
                display: true,
                labelString: "Hashes Per Second"
              }
            }
          ],
        }
      }
    }) /* eslint no-undef:0, no-unused-vars:0 */

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
  const newHeight = canvas.parent().height()
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
