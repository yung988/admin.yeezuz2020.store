import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const packetaApi = axios.create({
  baseURL: process.env.PACKETA_BASE_URL,
  headers: {
    'Content-Type': 'application/xml',
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

// Helper function to create XML from packet data
const createPacketXML = (orderData: OrderData, apiPassword: string): string => {
  return `<?xml version="1.0" encoding="utf-8"?>
<createPacket>
  <apiPassword>${apiPassword}</apiPassword>
  <packetAttributes>
    <number>${orderData.orderNumber}</number>
    <name>${orderData.customerName}</name>
    <surname>${orderData.customerSurname}</surname>
    <email>${orderData.customerEmail}</email>
    <phone>${orderData.customerPhone}</phone>
    <addressId>${orderData.pickupPointId}</addressId>
    <cod>${orderData.cashOnDelivery || 0}</cod>
    <value>${orderData.orderValue}</value>
    <weight>${orderData.weight}</weight>
    <eshopId>${process.env.PACKETA_SENDER_ID || 'eshop'}</eshopId>
  </packetAttributes>
</createPacket>`;
};

// Helper function to parse XML response
const parsePacketaResponse = async (xmlResponse: string): Promise<any> => {
  try {
    const result = await parseStringPromise(xmlResponse, { explicitArray: false });
    return result;
  } catch (error) {
    console.error('XML parsing error:', error);
    throw new Error('Failed to parse XML response');
  }
};

export const createPacketaShipment = async (orderData: OrderData) => {
  try {
    const xmlData = createPacketXML(orderData, process.env.PACKETA_API_PASSWORD!);
    
    const response = await packetaApi.post('/', xmlData);
    
    // Parse XML response
    const parsedResponse = await parsePacketaResponse(response.data);
    
    // Check if response contains error
    if (parsedResponse.response?.status === 'fault') {
      throw new Error(`Packeta API Error: ${parsedResponse.response.fault} - ${parsedResponse.response.string}`);
    }
    
    // Return the packet details
    return {
      id: parsedResponse.PacketIdDetail?.id || parsedResponse.response?.id,
      barcode: parsedResponse.PacketIdDetail?.barcode || parsedResponse.response?.barcode,
      barcodeText: parsedResponse.PacketIdDetail?.barcodeText || parsedResponse.response?.barcodeText
    };
  } catch (error: any) {
    console.error('Packeta API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Helper function to create XML for packet label PDF
const createPacketLabelXML = (packetIds: string[], apiPassword: string, format: string = 'A6'): string => {
  const packetIdsXml = packetIds.map(id => `<id>${id}</id>`).join('\n    ');
  return `<?xml version="1.0" encoding="utf-8"?>
<packetLabelsPdf>
  <apiPassword>${apiPassword}</apiPassword>
  <packetIds>
    ${packetIdsXml}
  </packetIds>
  <format>${format}</format>
</packetLabelsPdf>`;
};

export const generatePacketaLabel = async (packetId: string) => {
  try {
    const xmlData = createPacketLabelXML([packetId], process.env.PACKETA_API_PASSWORD!, 'A6');
    
    const response = await packetaApi.post('/packetLabelsPdf', xmlData);
    
    // Parse XML response
    const parsedResponse = await parsePacketaResponse(response.data);
    
    // Check if response contains error
    if (parsedResponse.response?.status === 'fault') {
      throw new Error(`Packeta API Error: ${parsedResponse.response.fault} - ${parsedResponse.response.string}`);
    }
    
    return {
      pdf: parsedResponse.response || response.data // Base64 PDF data
    };
  } catch (error: any) {
    console.error('Label generation error:', error);
    throw error;
  }
};

export const generateMultipleLabels = async (packetIds: string[]) => {
  try {
    const xmlData = createPacketLabelXML(packetIds, process.env.PACKETA_API_PASSWORD!, 'A4');
    
    const response = await packetaApi.post('/packetLabelsPdf', xmlData);
    
    // Parse XML response
    const parsedResponse = await parsePacketaResponse(response.data);
    
    // Check if response contains error
    if (parsedResponse.response?.status === 'fault') {
      throw new Error(`Packeta API Error: ${parsedResponse.response.fault} - ${parsedResponse.response.string}`);
    }
    
    return {
      pdf: parsedResponse.response || response.data // Base64 PDF data
    };
  } catch (error: any) {
    console.error('Multiple labels generation error:', error);
    throw error;
  }
};

// Helper function to create XML for packet status
const createPacketStatusXML = (packetId: string, apiPassword: string): string => {
  return `<?xml version="1.0" encoding="utf-8"?>
<packetStatus>
  <apiPassword>${apiPassword}</apiPassword>
  <packetId>${packetId}</packetId>
</packetStatus>`;
};

export const getPacketaStatus = async (packetId: string) => {
  try {
    const xmlData = createPacketStatusXML(packetId, process.env.PACKETA_API_PASSWORD!);
    
    const response = await packetaApi.post('/packetStatus', xmlData);
    
    // Parse XML response
    const parsedResponse = await parsePacketaResponse(response.data);
    
    // Check if response contains error
    if (parsedResponse.response?.status === 'fault') {
      throw new Error(`Packeta API Error: ${parsedResponse.response.fault} - ${parsedResponse.response.string}`);
    }
    
    return parsedResponse;
  } catch (error: any) {
    console.error('Status check error:', error);
    throw error;
  }
};
