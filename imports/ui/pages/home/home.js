import './home.html'
import '../../components/status/status.js'

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

 
  // Call stats API to get timeseries data for homepage chart
  Meteor.call('getStats', { include_timeseries: true }, (err, res) => {
    if (err) {
      console.log(err)
    } else {
      let chartLineData = {
        labels: [],
        datasets: [],
      }

      // Create chart axis objects
      let labels = []
      let hashPower = {
        label: 'Hash Power (hps)',
        borderColor: '#DC255D',
        backgroundColor: '#DC255D',
        fill: false,
        data: [],
        yAxisID: "y-axis-2",
        pointRadius: 0,
        borderWidth: 2,
      }
      let difficulty = {
        label: 'Difficulty',
        borderColor: '#4A90E2',
        backgroundColor: '#4A90E2',
        fill: false,
        data: [],
        yAxisID: "y-axis-2",
        pointRadius: 0,
        borderWidth: 2,
      }
      let movingAverage = {
        label: 'Block Time Average (s)',
        borderColor: '#0A0724',
        backgroundColor: '#0A0724',
        fill: false,
        data: [],
        yAxisID: "y-axis-1",
        pointRadius: 0,
        borderWidth: 2,
      }
      let blockTime = {
        label: 'Block Time (s)',
        borderColor: '#1EE9CB',
        backgroundColor: '#1EE9CB',
        fill: false,
        showLine: false,
        data: [],
        yAxisID: "y-axis-1",
        pointRadius: 2,
        borderWidth: 2,
      }

      // Loop all API responses and push data into axis objects
      _.each(res.block_timeseries, (entry) => {
        labels.push(entry.number)
        hashPower.data.push(entry.hash_power)
        difficulty.data.push(entry.difficulty)
        movingAverage.data.push(entry.time_movavg)
        blockTime.data.push(entry.time_last)
      })

      // Push axis objects into chart data
      chartLineData.labels = labels
      chartLineData.datasets.push(hashPower)
      chartLineData.datasets.push(difficulty)
      chartLineData.datasets.push(movingAverage)
      chartLineData.datasets.push(blockTime)

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
    }
  })
})
