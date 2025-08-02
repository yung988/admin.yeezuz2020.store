// Test script pro Packeta API
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const packetaApi = axios.create({
  baseURL: process.env.PACKETA_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// Testovací údaje (FIKTIVNÍ!)
const testOrderData = {
  orderNumber: `TEST-${Date.now()}`,
  customerName: 'Jan',
  customerSurname: 'Testovací',
  customerEmail: 'test@example.com',
  customerPhone: '+420123456789',
  pickupPointId: '79', // Praha 1 - testovací výdejní místo
  orderValue: 1500, // 15 Kč
  weight: 1.0, // 1 kg
  cashOnDelivery: 0, // bez dobírky
};

async function testCreatePacketaShipment() {
  try {
    console.log('🚀 Testování vytvoření zásilky...');
    console.log('📦 Testovací data:', testOrderData);
    
    const response = await packetaApi.post('/packet', {
      apiPassword: process.env.PACKETA_API_PASSWORD,
      packetAttributes: {
        number: testOrderData.orderNumber,
        name: testOrderData.customerName,
        surname: testOrderData.customerSurname,
        email: testOrderData.customerEmail,
        phone: testOrderData.customerPhone,
        addressId: testOrderData.pickupPointId,
        cod: testOrderData.cashOnDelivery,
        value: testOrderData.orderValue,
        weight: testOrderData.weight,
        adultContent: 0,
        eshop: process.env.PACKETA_SENDER_ID || 'test-eshop'
      }
    });
    
    console.log('✅ Úspěch! Odpověď API:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.status === 'ok') {
      console.log(`🎉 Zásilka vytvořena s ID: ${response.data.id}`);
      return response.data.id;
    } else {
      console.log('❌ Chyba v odpovědi:', response.data.fault);
    }
    
  } catch (error) {
    console.error('💥 Chyba při volání API:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

async function testGetPacketStatus(packetId) {
  try {
    console.log(`🔍 Testování stavu zásilky ${packetId}...`);
    
    const response = await packetaApi.get('/packet-status', {
      params: {
        apiPassword: process.env.PACKETA_API_PASSWORD,
        packetId: packetId,
      }
    });
    
    console.log('✅ Stav zásilky:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('💥 Chyba při kontrole stavu:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
  }
}

async function runTests() {
  console.log('🧪 PACKETA API TEST');
  console.log('==================');
  console.log(`API URL: ${process.env.PACKETA_BASE_URL}`);
  console.log(`API Key: ${process.env.PACKETA_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`Sender ID: ${process.env.PACKETA_SENDER_ID}`);
  console.log('');
  
  // Test 1: Vytvoření zásilky
  const packetId = await testCreatePacketaShipment();
  
  // Test 2: Kontrola stavu (pokud se zásilka vytvořila)
  if (packetId) {
    console.log('');
    await testGetPacketStatus(packetId);
  }
  
  console.log('');
  console.log('🏁 Test dokončen');
}

// Spusť testy
runTests().catch(console.error);
