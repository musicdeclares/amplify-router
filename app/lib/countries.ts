// ISO 3166-1 alpha-2 country codes with labels
// This list matches the validation function in the database

export interface CountryOption {
  value: string;
  label: string;
}

// Full ISO 3166-1 alpha-2 country list
export const COUNTRY_OPTIONS: CountryOption[] = [
  { value: 'AD', label: 'Andorra' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'AF', label: 'Afghanistan' },
  { value: 'AG', label: 'Antigua and Barbuda' },
  { value: 'AI', label: 'Anguilla' },
  { value: 'AL', label: 'Albania' },
  { value: 'AM', label: 'Armenia' },
  { value: 'AO', label: 'Angola' },
  { value: 'AQ', label: 'Antarctica' },
  { value: 'AR', label: 'Argentina' },
  { value: 'AS', label: 'American Samoa' },
  { value: 'AT', label: 'Austria' },
  { value: 'AU', label: 'Australia' },
  { value: 'AW', label: 'Aruba' },
  { value: 'AX', label: 'Aland Islands' },
  { value: 'AZ', label: 'Azerbaijan' },
  { value: 'BA', label: 'Bosnia and Herzegovina' },
  { value: 'BB', label: 'Barbados' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'BE', label: 'Belgium' },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'BG', label: 'Bulgaria' },
  { value: 'BH', label: 'Bahrain' },
  { value: 'BI', label: 'Burundi' },
  { value: 'BJ', label: 'Benin' },
  { value: 'BL', label: 'Saint Barthelemy' },
  { value: 'BM', label: 'Bermuda' },
  { value: 'BN', label: 'Brunei' },
  { value: 'BO', label: 'Bolivia' },
  { value: 'BQ', label: 'Bonaire, Sint Eustatius and Saba' },
  { value: 'BR', label: 'Brazil' },
  { value: 'BS', label: 'Bahamas' },
  { value: 'BT', label: 'Bhutan' },
  { value: 'BV', label: 'Bouvet Island' },
  { value: 'BW', label: 'Botswana' },
  { value: 'BY', label: 'Belarus' },
  { value: 'BZ', label: 'Belize' },
  { value: 'CA', label: 'Canada' },
  { value: 'CC', label: 'Cocos (Keeling) Islands' },
  { value: 'CD', label: 'Democratic Republic of the Congo' },
  { value: 'CF', label: 'Central African Republic' },
  { value: 'CG', label: 'Republic of the Congo' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'CI', label: 'Ivory Coast' },
  { value: 'CK', label: 'Cook Islands' },
  { value: 'CL', label: 'Chile' },
  { value: 'CM', label: 'Cameroon' },
  { value: 'CN', label: 'China' },
  { value: 'CO', label: 'Colombia' },
  { value: 'CR', label: 'Costa Rica' },
  { value: 'CU', label: 'Cuba' },
  { value: 'CV', label: 'Cape Verde' },
  { value: 'CW', label: 'Curacao' },
  { value: 'CX', label: 'Christmas Island' },
  { value: 'CY', label: 'Cyprus' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'DE', label: 'Germany' },
  { value: 'DJ', label: 'Djibouti' },
  { value: 'DK', label: 'Denmark' },
  { value: 'DM', label: 'Dominica' },
  { value: 'DO', label: 'Dominican Republic' },
  { value: 'DZ', label: 'Algeria' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'EE', label: 'Estonia' },
  { value: 'EG', label: 'Egypt' },
  { value: 'EH', label: 'Western Sahara' },
  { value: 'ER', label: 'Eritrea' },
  { value: 'ES', label: 'Spain' },
  { value: 'ET', label: 'Ethiopia' },
  { value: 'FI', label: 'Finland' },
  { value: 'FJ', label: 'Fiji' },
  { value: 'FK', label: 'Falkland Islands' },
  { value: 'FM', label: 'Micronesia' },
  { value: 'FO', label: 'Faroe Islands' },
  { value: 'FR', label: 'France' },
  { value: 'GA', label: 'Gabon' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'GD', label: 'Grenada' },
  { value: 'GE', label: 'Georgia' },
  { value: 'GF', label: 'French Guiana' },
  { value: 'GG', label: 'Guernsey' },
  { value: 'GH', label: 'Ghana' },
  { value: 'GI', label: 'Gibraltar' },
  { value: 'GL', label: 'Greenland' },
  { value: 'GM', label: 'Gambia' },
  { value: 'GN', label: 'Guinea' },
  { value: 'GP', label: 'Guadeloupe' },
  { value: 'GQ', label: 'Equatorial Guinea' },
  { value: 'GR', label: 'Greece' },
  { value: 'GS', label: 'South Georgia and the South Sandwich Islands' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'GU', label: 'Guam' },
  { value: 'GW', label: 'Guinea-Bissau' },
  { value: 'GY', label: 'Guyana' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'HM', label: 'Heard Island and McDonald Islands' },
  { value: 'HN', label: 'Honduras' },
  { value: 'HR', label: 'Croatia' },
  { value: 'HT', label: 'Haiti' },
  { value: 'HU', label: 'Hungary' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'IE', label: 'Ireland' },
  { value: 'IL', label: 'Israel' },
  { value: 'IM', label: 'Isle of Man' },
  { value: 'IN', label: 'India' },
  { value: 'IO', label: 'British Indian Ocean Territory' },
  { value: 'IQ', label: 'Iraq' },
  { value: 'IR', label: 'Iran' },
  { value: 'IS', label: 'Iceland' },
  { value: 'IT', label: 'Italy' },
  { value: 'JE', label: 'Jersey' },
  { value: 'JM', label: 'Jamaica' },
  { value: 'JO', label: 'Jordan' },
  { value: 'JP', label: 'Japan' },
  { value: 'KE', label: 'Kenya' },
  { value: 'KG', label: 'Kyrgyzstan' },
  { value: 'KH', label: 'Cambodia' },
  { value: 'KI', label: 'Kiribati' },
  { value: 'KM', label: 'Comoros' },
  { value: 'KN', label: 'Saint Kitts and Nevis' },
  { value: 'KP', label: 'North Korea' },
  { value: 'KR', label: 'South Korea' },
  { value: 'KW', label: 'Kuwait' },
  { value: 'KY', label: 'Cayman Islands' },
  { value: 'KZ', label: 'Kazakhstan' },
  { value: 'LA', label: 'Laos' },
  { value: 'LB', label: 'Lebanon' },
  { value: 'LC', label: 'Saint Lucia' },
  { value: 'LI', label: 'Liechtenstein' },
  { value: 'LK', label: 'Sri Lanka' },
  { value: 'LR', label: 'Liberia' },
  { value: 'LS', label: 'Lesotho' },
  { value: 'LT', label: 'Lithuania' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'LV', label: 'Latvia' },
  { value: 'LY', label: 'Libya' },
  { value: 'MA', label: 'Morocco' },
  { value: 'MC', label: 'Monaco' },
  { value: 'MD', label: 'Moldova' },
  { value: 'ME', label: 'Montenegro' },
  { value: 'MF', label: 'Saint Martin' },
  { value: 'MG', label: 'Madagascar' },
  { value: 'MH', label: 'Marshall Islands' },
  { value: 'MK', label: 'North Macedonia' },
  { value: 'ML', label: 'Mali' },
  { value: 'MM', label: 'Myanmar' },
  { value: 'MN', label: 'Mongolia' },
  { value: 'MO', label: 'Macao' },
  { value: 'MP', label: 'Northern Mariana Islands' },
  { value: 'MQ', label: 'Martinique' },
  { value: 'MR', label: 'Mauritania' },
  { value: 'MS', label: 'Montserrat' },
  { value: 'MT', label: 'Malta' },
  { value: 'MU', label: 'Mauritius' },
  { value: 'MV', label: 'Maldives' },
  { value: 'MW', label: 'Malawi' },
  { value: 'MX', label: 'Mexico' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'MZ', label: 'Mozambique' },
  { value: 'NA', label: 'Namibia' },
  { value: 'NC', label: 'New Caledonia' },
  { value: 'NE', label: 'Niger' },
  { value: 'NF', label: 'Norfolk Island' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'NI', label: 'Nicaragua' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'NO', label: 'Norway' },
  { value: 'NP', label: 'Nepal' },
  { value: 'NR', label: 'Nauru' },
  { value: 'NU', label: 'Niue' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'OM', label: 'Oman' },
  { value: 'PA', label: 'Panama' },
  { value: 'PE', label: 'Peru' },
  { value: 'PF', label: 'French Polynesia' },
  { value: 'PG', label: 'Papua New Guinea' },
  { value: 'PH', label: 'Philippines' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'PL', label: 'Poland' },
  { value: 'PM', label: 'Saint Pierre and Miquelon' },
  { value: 'PN', label: 'Pitcairn' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'PS', label: 'Palestine' },
  { value: 'PT', label: 'Portugal' },
  { value: 'PW', label: 'Palau' },
  { value: 'PY', label: 'Paraguay' },
  { value: 'QA', label: 'Qatar' },
  { value: 'RE', label: 'Reunion' },
  { value: 'RO', label: 'Romania' },
  { value: 'RS', label: 'Serbia' },
  { value: 'RU', label: 'Russia' },
  { value: 'RW', label: 'Rwanda' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'SB', label: 'Solomon Islands' },
  { value: 'SC', label: 'Seychelles' },
  { value: 'SD', label: 'Sudan' },
  { value: 'SE', label: 'Sweden' },
  { value: 'SG', label: 'Singapore' },
  { value: 'SH', label: 'Saint Helena' },
  { value: 'SI', label: 'Slovenia' },
  { value: 'SJ', label: 'Svalbard and Jan Mayen' },
  { value: 'SK', label: 'Slovakia' },
  { value: 'SL', label: 'Sierra Leone' },
  { value: 'SM', label: 'San Marino' },
  { value: 'SN', label: 'Senegal' },
  { value: 'SO', label: 'Somalia' },
  { value: 'SR', label: 'Suriname' },
  { value: 'SS', label: 'South Sudan' },
  { value: 'ST', label: 'Sao Tome and Principe' },
  { value: 'SV', label: 'El Salvador' },
  { value: 'SX', label: 'Sint Maarten' },
  { value: 'SY', label: 'Syria' },
  { value: 'SZ', label: 'Eswatini' },
  { value: 'TC', label: 'Turks and Caicos Islands' },
  { value: 'TD', label: 'Chad' },
  { value: 'TF', label: 'French Southern Territories' },
  { value: 'TG', label: 'Togo' },
  { value: 'TH', label: 'Thailand' },
  { value: 'TJ', label: 'Tajikistan' },
  { value: 'TK', label: 'Tokelau' },
  { value: 'TL', label: 'Timor-Leste' },
  { value: 'TM', label: 'Turkmenistan' },
  { value: 'TN', label: 'Tunisia' },
  { value: 'TO', label: 'Tonga' },
  { value: 'TR', label: 'Turkey' },
  { value: 'TT', label: 'Trinidad and Tobago' },
  { value: 'TV', label: 'Tuvalu' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'TZ', label: 'Tanzania' },
  { value: 'UA', label: 'Ukraine' },
  { value: 'UG', label: 'Uganda' },
  { value: 'UM', label: 'United States Minor Outlying Islands' },
  { value: 'US', label: 'United States' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'UZ', label: 'Uzbekistan' },
  { value: 'VA', label: 'Vatican City' },
  { value: 'VC', label: 'Saint Vincent and the Grenadines' },
  { value: 'VE', label: 'Venezuela' },
  { value: 'VG', label: 'British Virgin Islands' },
  { value: 'VI', label: 'U.S. Virgin Islands' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'VU', label: 'Vanuatu' },
  { value: 'WF', label: 'Wallis and Futuna' },
  { value: 'WS', label: 'Samoa' },
  { value: 'YE', label: 'Yemen' },
  { value: 'YT', label: 'Mayotte' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'ZM', label: 'Zambia' },
  { value: 'ZW', label: 'Zimbabwe' },
];

// Quick lookup for country code to label
export const COUNTRY_CODE_TO_LABEL: Record<string, string> = COUNTRY_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<string, string>
);

// Get country label from code
export function getCountryLabel(code: string): string {
  return COUNTRY_CODE_TO_LABEL[code.toUpperCase()] || code;
}

// Convert country code to flag emoji
// Uses Unicode regional indicator symbols (A=🇦, B=🇧, etc.)
export function getCountryFlag(code: string): string {
  const upperCode = code.toUpperCase();
  if (upperCode.length !== 2) return '';

  // Regional indicator symbols start at U+1F1E6 (for 'A')
  // ASCII 'A' is 65, so offset is 0x1F1E6 - 65 = 127397
  const offset = 127397;
  const firstChar = upperCode.charCodeAt(0);
  const secondChar = upperCode.charCodeAt(1);

  // Validate it's A-Z
  if (firstChar < 65 || firstChar > 90 || secondChar < 65 || secondChar > 90) {
    return '';
  }

  return String.fromCodePoint(firstChar + offset) + String.fromCodePoint(secondChar + offset);
}

// Validate ISO 3166-1 alpha-2 country code
export function isValidISOCountryCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(COUNTRY_CODE_TO_LABEL, code.toUpperCase());
}

// Search countries by name or code (for typeahead)
export function searchCountries(query: string): CountryOption[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return COUNTRY_OPTIONS;

  return COUNTRY_OPTIONS.filter(
    (option) =>
      option.label.toLowerCase().includes(normalizedQuery) ||
      option.value.toLowerCase().includes(normalizedQuery)
  );
}

// Get countries that have active orgs (for filtering)
export function getCountriesWithOrgs(orgCountryCodes: string[]): CountryOption[] {
  const codesSet = new Set(orgCountryCodes.map((c) => c.toUpperCase()));
  return COUNTRY_OPTIONS.filter((option) => codesSet.has(option.value));
}
