const BCKGeo = (() => {
  const SOVEREIGN_ISO2 = new Set(`AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PS PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW`.split(' '));

  const INDIA_STATES = [
    ['AN','Andaman and Nicobar Islands'],['AP','Andhra Pradesh'],['AR','Arunachal Pradesh'],['AS','Assam'],['BR','Bihar'],['CH','Chandigarh'],['CT','Chhattisgarh'],['DN','Dadra and Nagar Haveli and Daman and Diu'],['DL','Delhi'],['GA','Goa'],['GJ','Gujarat'],['HR','Haryana'],['HP','Himachal Pradesh'],['JK','Jammu and Kashmir'],['JH','Jharkhand'],['KA','Karnataka'],['KL','Kerala'],['LA','Ladakh'],['LD','Lakshadweep'],['MP','Madhya Pradesh'],['MH','Maharashtra'],['MN','Manipur'],['ML','Meghalaya'],['MZ','Mizoram'],['NL','Nagaland'],['OD','Odisha'],['PY','Puducherry'],['PB','Punjab'],['RJ','Rajasthan'],['SK','Sikkim'],['TN','Tamil Nadu'],['TG','Telangana'],['TR','Tripura'],['UP','Uttar Pradesh'],['UT','Uttarakhand'],['WB','West Bengal']
  ].map(([code,name]) => ({ code, name }));

  const moduleUrls = [
    'https://cdn.jsdelivr.net/npm/@countrystatecity/countries-browser@1.0.4/+esm',
    'https://esm.sh/@countrystatecity/countries-browser@1.0.4'
  ];

  let api = null;
  let countryRows = [];
  const statesCache = new Map();
  const citiesCache = new Map();

  function sortByName(a, b) {
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  }

  async function loadApi() {
    if (api) return api;
    let lastError;
    for (const url of moduleUrls) {
      try {
        const mod = await import(url);
        const source = mod.default || mod;
        const getCountries = mod.getCountries || source.getCountries;
        const getStatesOfCountry = mod.getStatesOfCountry || source.getStatesOfCountry;
        const getCitiesOfState = mod.getCitiesOfState || source.getCitiesOfState;
        if (getCountries && getStatesOfCountry && getCitiesOfState) {
          api = { getCountries, getStatesOfCountry, getCitiesOfState };
          return api;
        }
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('Location library could not load');
  }

  async function loadCountriesAndStates() {
    const source = await loadApi();
    const raw = await source.getCountries();
    countryRows = raw
      .map(country => ({
        iso2: country.iso2 || country.isoCode || country.iso_code || '',
        name: country.name || ''
      }))
      .filter(country => SOVEREIGN_ISO2.has(country.iso2) && country.name)
      .sort(sortByName);

    const indiaIndex = countryRows.findIndex(country => country.iso2 === 'IN');
    if (indiaIndex > 0) {
      const [india] = countryRows.splice(indiaIndex, 1);
      countryRows.unshift(india);
    }
    return countryRows;
  }

  function countries() {
    return countryRows;
  }

  function countryByIso2(iso2) {
    return countryRows.find(country => country.iso2 === iso2) || null;
  }

  function countryByName(name) {
    const normal = String(name || '').trim().toLowerCase();
    return countryRows.find(country => country.name.toLowerCase() === normal) || null;
  }

  async function statesFor(iso2) {
    if (statesCache.has(iso2)) return statesCache.get(iso2);
    const source = await loadApi();
    let rows = [];
    try {
      const raw = await source.getStatesOfCountry(iso2);
      rows = (raw || [])
        .map(state => ({
          name: state.name || '',
          code: state.iso2 || state.isoCode || state.state_code || ''
        }))
        .filter(state => state.name)
        .sort(sortByName);
    } catch (error) {
      if (iso2 !== 'IN') throw error;
    }
    if (!rows.length && iso2 === 'IN') rows = INDIA_STATES;
    statesCache.set(iso2, rows);
    return rows;
  }

  async function citiesFor(iso2, stateNameOrCode) {
    if (!stateNameOrCode || stateNameOrCode === '__NONE__') return [];
    const states = await statesFor(iso2);
    const state = states.find(item => item.name === stateNameOrCode || item.code === stateNameOrCode);
    if (!state) return [];
    const key = `${iso2}:${state.code || state.name}`;
    if (citiesCache.has(key)) return citiesCache.get(key);

    const source = await loadApi();
    const raw = await source.getCitiesOfState(iso2, state.code);
    const cities = [...new Set((raw || [])
      .map(city => String(city.name || '').trim())
      .filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    citiesCache.set(key, cities);
    return cities;
  }

  return {
    loadCountriesAndStates,
    countries,
    countryByIso2,
    countryByName,
    statesFor,
    citiesFor
  };
})();

window.BCKGeo = BCKGeo;
