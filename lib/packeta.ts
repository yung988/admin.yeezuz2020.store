import axios from 'axios';

const packetaApi = axios.create({
  baseURL: process.env.PACKETA_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerSurname: string;
  customerEmail: string;
  customerPhone: string;
  pickupPointId: string;
  cashOnDelivery?: number;
  orderValue: number;
  weight: number;
}

export const createPacketaShipment = async (orderData: OrderData) => {
  try {
    const response = await packetaApi.post('/packet', {
      apiPassword: process.env.PACKETA_API_PASSWORD,
      packetAttributes: {
        number: orderData.orderNumber,
        name: orderData.customerName,
        surname: orderData.customerSurname,
        email: orderData.customerEmail,
        phone: orderData.customerPhone,
        addressId: orderData.pickupPointId,
        cod: orderData.cashOnDelivery || 0,
        value: orderData.orderValue,
        weight: orderData.weight,
        adultContent: 0,
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Packeta API Error:', error.response?.data);
    throw error;
  }
};

export const generatePacketaLabel = async (packetId: string) => {
  try {
    const response = await packetaApi.post('/packet-label-pdf', {
      apiPassword: process.env.PACKETA_API_PASSWORD,
      packetIds: [packetId],
      format: 'A4',
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Label generation error:', error);
    throw error;
  }
};

export const generateMultipleLabels = async (packetIds: string[]) => {
  try {
    const response = await packetaApi.post('/packet-label-pdf', {
      apiPassword: process.env.PACKETA_API_PASSWORD,
      packetIds: packetIds,
      format: 'A4',
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Multiple labels generation error:', error);
    throw error;
  }
};

export const getPacketaStatus = async (packetId: string) => {
  try {
    const response = await packetaApi.get('/packet-status', {
      params: {
        apiPassword: process.env.PACKETA_API_PASSWORD,
        packetId: packetId,
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Status check error:', error);
    throw error;
  }
};
