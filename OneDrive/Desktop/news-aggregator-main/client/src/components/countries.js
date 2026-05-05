let twoLetterISO = [
    "us", // United States
    "cn", // China
    "de", // Germany
    "jp", // Japan
    "in", // India
    "gb", // United Kingdom
    "fr", // France
    "it", // Italy
    "ca", // Canada
    "br", // Brazil
    "np"  // Nepal
];


var isoCountries = {
    'US' : 'United States',
    'CN' : 'China',
    'DE' : 'Germany',
    'JP' : 'Japan',
    'IN' : 'India',
    'GB' : 'United Kingdom',
    'FR' : 'France',
    'IT' : 'Italy',
    'CA' : 'Canada',
    'BR' : 'Brazil',
    'NP' : 'Nepal'
};
   
  
  


let countries = twoLetterISO.map(element => ({
    iso_2_alpha: element,
    png: `https://flagcdn.com/24x18/${element}.png`,
    countryName: isoCountries[element.toUpperCase()] || element.toUpperCase()
}));



export default countries; 