import * as XLSX from 'xlsx';

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  Residence?: { name: string };
  created_at?: string;
}

export interface Residence {
  id: number;
  name: string;
  address: string;
  num_apartments: number;
  contact: string;
  created_at?: string;
}

export interface Charge {
  id: number;
  description: string;
  amount: number;
  date: string;
  Residence?: { name: string };
  created_at?: string;
}

// Export data to Excel file
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1'): boolean => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

// Format date for Excel
export const formatDateForExcel = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
};

// Format currency for Excel
export const formatCurrencyForExcel = (amount: number): string => {
  if (!amount) return '0 DH';
  return `${Number(amount).toLocaleString('fr-FR')} DH`;
};

// Export clients data
export const exportClientsToExcel = (clients: Client[]): boolean => {
  const formattedData = clients.map(client => ({
    'ID': client.id,
    'Nom': client.name,
    'Email': client.email,
    'Téléphone': client.phone,
    'Adresse': client.address,
    'Résidence': client.Residence?.name || 'N/A',
    'Date de création': formatDateForExcel(client.created_at || '')
  }));
  
  return exportToExcel(formattedData, 'clients_syndicapp', 'Clients');
};

// Export residences data
export const exportResidencesToExcel = (residences: Residence[]): boolean => {
  const formattedData = residences.map(residence => ({
    'ID': residence.id,
    'Nom': residence.name,
    'Adresse': residence.address,
    'Nombre d\'appartements': residence.num_apartments,
    'Contact': residence.contact,
    'Date de création': formatDateForExcel(residence.created_at || '')
  }));
  
  return exportToExcel(formattedData, 'residences_syndicapp', 'Résidences');
};

// Export charges data
export const exportChargesToExcel = (charges: Charge[]): boolean => {
  const formattedData = charges.map(charge => ({
    'ID': charge.id,
    'Description': charge.description,
    'Montant': formatCurrencyForExcel(charge.amount),
    'Date': formatDateForExcel(charge.date),
    'Résidence': charge.Residence?.name || 'N/A',
    'Date de création': formatDateForExcel(charge.created_at || '')
  }));
  
  return exportToExcel(formattedData, 'charges_syndicapp', 'Charges');
}; 