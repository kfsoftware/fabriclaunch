import airportCodes from 'airport-codes/airports.json';
import countries from 'world-countries';

interface Country {
	name: {
		common: string;
		official: string;
	};
	cca2: string;
	cca3: string;
	capital?: string[];
	latlng: [number, number];
}

export function getCoordsForCode(code: string): [number, number] {
	// Check if it's a city/airport code
	const airport = airportCodes.find(i => i.iata === code.toUpperCase())
	if (airport) {
		return [parseFloat(airport.latitude), parseFloat(airport.longitude)];
	}

	// Check if it's a country code (both alpha-2 and alpha-3)
	const country: Country | undefined = countries.find(
		(c: Country) =>
			c.cca2.toLowerCase() === code.toLowerCase() ||
			c.cca3.toLowerCase() === code.toLowerCase() ||
			c.name.common.toLowerCase() === code.toLowerCase()
	);

	if (country && country.latlng && country.latlng.length > 0) {
		return [country.latlng[0], country.latlng[1]];
	}

	// If it's neither a recognized city nor country code
	return [null, null];
}
