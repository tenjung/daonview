export interface DaumAddressData {
    address: string;
    addressType: string;
    bname: string;
    buildingName: string;
    zonecode: string;
}

export function formatDaumAddress(data: DaumAddressData): string {
    if (data.addressType !== 'R') return data.address;

    const details = [data.bname, data.buildingName].filter(Boolean).join(', ');
    return details ? `${data.address} (${details})` : data.address;
}
