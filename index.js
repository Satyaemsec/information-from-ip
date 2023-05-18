const axios = require('axios');
const express = require('express');
const fs = require('fs');
const app = express();

const apiKey = 'ICEmsaxB4ChYPHQyhFUwNPNgI9lZvz7h';
const delay = 500; // 1 second delay

app.get('/scada-data', async (req, res) => {
  try {
    const ipArray = ["34.95.101.239","34.117.8.23","1.15.107.30","34.160.200.63","34.107.142.97","34.160.150.95","85.118.64.80","13.236.116.220","34.149.199.70","34.117.185.155","47.104.42.3","34.144.242.131","34.107.197.21","34.120.19.144"];

    let jsonData = [];

    for (let i = 0; i < ipArray.length; i++) {
      const ip = ipArray[i];

      try {
        const hostResponse = await axios.get(`https://api.shodan.io/shodan/host/${ip}?key=${apiKey}`);

        const ports = hostResponse.data.ports;
        const data = hostResponse.data.data;

        let openTcpPorts = [];
        let openUdpPorts = [];

        let productName = '';
        let vendorName = '';
        let os = '';
        let deviceName = '';

        for (let j = 0; j < data.length; j++) {
          const dataItem = data[j];

          if (dataItem.hasOwnProperty('product')) {
            productName = dataItem.product;
          }

          if (dataItem.hasOwnProperty('org')) {
            vendorName = dataItem.org;
          }

          if (dataItem.hasOwnProperty('os')) {
            os = dataItem.os;
          }

          if (dataItem.hasOwnProperty('tags')) {
            deviceName = dataItem.tags;
          }

          if (dataItem.hasOwnProperty('port')) {
            const port = dataItem.port;
            const protocol = dataItem.transport;

            if (protocol === 'tcp') {
              openTcpPorts.push(port);
            } else if (protocol === 'udp') {
              openUdpPorts.push(port);
            }
          }
        }

        jsonData.push({ ip, openTcpPorts, openUdpPorts, os, productName, vendorName, deviceName });
      } catch (error) {
        console.error(`Error fetching data for IP ${ip}: ${error.message}`);
        jsonData.push({ ip, error: 'Unable to fetch information' });
        continue; // Skip to the next IP address
      }

      // Add delay to avoid hitting rate limit
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    fs.writeFileSync('scada-data.json', JSON.stringify(jsonData));
    res.json(jsonData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching ICS data from Shodan');
  }
});

app.listen(4000, () => {
  console.log('Server listening on port 4000');
});
